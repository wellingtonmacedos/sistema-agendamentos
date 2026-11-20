const { addMinutes, format, isBefore, isAfter, startOfDay, endOfDay } = require('date-fns');
const Appointment = require('../models/Appointment');
const Block = require('../models/Block');
const Service = require('../models/Service');
const Salon = require('../models/Salon');
const Professional = require('../models/Professional');

// Helper to parse "HH:mm" to Date on a specific day
const timeToDate = (timeStr, baseDate) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
};

// O sistema grava e exibe horarios no "relogio de parede" local do servidor.
// O negocio opera em America/Sao_Paulo (UTC-3), mas o servidor roda em UTC,
// entao "new Date()" fica 3h a frente do horario real do salao e o filtro de
// antecedencia minima apagava os horarios do dia inteiro. Esta funcao devolve
// o horario atual do negocio na MESMA referencia usada pelos horarios salvos.
const BUSINESS_OFFSET_MIN = -180; // America/Sao_Paulo (UTC-3, sem horario de verao desde 2019)

const businessNow = () => {
    const serverOffsetMin = -new Date().getTimezoneOffset();
    return new Date(Date.now() + (BUSINESS_OFFSET_MIN - serverOffsetMin) * 60 * 1000);
};

/**
 * Calculate available slots respecting:
 * 1. Salon Working Hours (Open/Close)
 * 2. Professional Overrides
 * 3. Fixed Breaks (Lunch)
 * 4. Dynamic Blocks (Holidays)
 * 5. Agenda Settings (Min Notice, Future Limit, Buffer)
 * 6. Existing Appointments
 */
const getAvailableSlots = async (salonId, dateStr, professionalId, serviceIds) => {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0 = Sunday

    // 1. Fetch Entities
    const salon = await Salon.findById(salonId);
    const professional = await Professional.findById(professionalId);
    if (!salon || !professional) throw new Error('Invalid salon or professional');

    // 2. Determine Working Hours (Inheritance)
    let workDay = undefined;
    
    // Check Professional Override
    if (professional.workingHours && professional.workingHours.get(String(dayOfWeek))) {
        workDay = professional.workingHours.get(String(dayOfWeek));
    } 
    // Fallback to Salon
    else if (salon.workingHours && salon.workingHours.get(String(dayOfWeek))) {
        workDay = salon.workingHours.get(String(dayOfWeek));
    }

    // Fetch Blocks early to check for Arrival Order override
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const blocks = await Block.find({
        salonId,
        $or: [
            { professionalId: professionalId },
            { professionalId: null },
            { professionalId: { $exists: false } }
        ],
        startTime: { $lt: dayEnd },
        endTime: { $gt: dayStart }
    });

    // Check if any block is Arrival Order exception
    if (blocks.some(b => b.type === 'ARRIVAL_ORDER')) {
        throw { name: 'ArrivalOrder' };
    }

    // If no config or closed
    if (!workDay || !workDay.isOpen) {
        return [];
    }

    // Check if configured as Arrival Order (Recurrent)
    if (workDay.isArrivalOrder) {
        throw { name: 'ArrivalOrder' };
    }

    // 3. Settings & Duration
    const services = await Service.find({ _id: { $in: serviceIds } });
    const totalDuration = services.reduce((acc, curr) => acc + curr.duration, 0);
    const { slotInterval = 30, appointmentBuffer = 0, minNoticeMinutes = 60, maxFutureDays = 30 } = salon.settings || {};

    // 4. Validate Future Limit
    const today = startOfDay(businessNow());
    const targetDate = startOfDay(date);
    const maxDate = addMinutes(today, maxFutureDays * 24 * 60);
    
    if (isAfter(targetDate, maxDate)) return [];
    if (isBefore(targetDate, today)) return []; // Past days

    // 5. Fetch Conflicts (Appointments)
    // dayStart and dayEnd are already defined above

    const appointments = await Appointment.find({
        salonId,
        professionalId,
        startTime: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: 'cancelled' }
    });

    // 6. Generate Slots
    const slots = [];
    const openTime = timeToDate(workDay.open, date);
    const closeTime = timeToDate(workDay.close, date);
    
    // Determine start point (considering minNotice if today)
    let currentTime = openTime;
    const now = businessNow();
    const minStart = addMinutes(now, minNoticeMinutes);

    while (addMinutes(currentTime, totalDuration) <= closeTime) {
        const slotStart = currentTime;
        const slotEnd = addMinutes(currentTime, totalDuration);

        // Checks:
        let isAvailable = true;

        // A. Past / Notice
        if (isBefore(slotStart, minStart)) {
            isAvailable = false;
        }

        // B. Breaks (Fixed in WorkDay)
        if (isAvailable && workDay.breaks) {
            for (const brk of workDay.breaks) {
                const breakStart = timeToDate(brk.start, date);
                const breakEnd = timeToDate(brk.end, date);
                // Overlap check
                if (slotStart < breakEnd && slotEnd > breakStart) {
                    isAvailable = false;
                    break;
                }
            }
        }

        // C. Blocks (Database)
        if (isAvailable) {
            for (const block of blocks) {
                // Overlap check
                if (slotStart < block.endTime && slotEnd > block.startTime) {
                    isAvailable = false;
                    break;
                }
            }
        }

        // D. Appointments (with Buffer)
        if (isAvailable) {
            for (const appt of appointments) {
                // Effective appointment range includes buffer AFTER
                const apptStart = appt.startTime;
                const apptEnd = addMinutes(appt.endTime, appointmentBuffer); 

                if (slotStart < apptEnd && slotEnd > apptStart) {
                    isAvailable = false;
                    break;
                }
            }
        }

        if (isAvailable) {
            slots.push({
                time: format(slotStart, 'HH:mm'),
                available: true
            });
        }

        // Increment
        currentTime = addMinutes(currentTime, slotInterval);
    }

    return slots;
};

module.exports = {
    getAvailableSlots
};
