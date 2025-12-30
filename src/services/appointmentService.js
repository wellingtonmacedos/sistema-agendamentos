const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Block = require('../models/Block');
const Customer = require('../models/Customer');
const Salon = require('../models/Salon');
const Professional = require('../models/Professional');
const { format, addMinutes } = require('date-fns');

// Internal Helpers
const somarMinutos = (horaInicio, duracaoMinutos) => {
    const [hours, minutes] = horaInicio.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    const newDate = addMinutes(date, duracaoMinutos);
    return format(newDate, 'HH:mm');
};

const existeConflito = async (salonId, professionalId, dateStr, horaInicio, horaFim) => {
    const startDateTime = new Date(`${dateStr}T${horaInicio}:00`);
    const endDateTime = new Date(`${dateStr}T${horaFim}:00`);
    const dayOfWeek = startDateTime.getDay();

    // 1. Check Working Hours (Is the salon/pro open at this time?)
    const salon = await Salon.findById(salonId);
    const professional = await Professional.findById(professionalId);
    
    let workDay = undefined;
    if (professional.workingHours && professional.workingHours.get(String(dayOfWeek))) {
        workDay = professional.workingHours.get(String(dayOfWeek));
    } else if (salon.workingHours && salon.workingHours.get(String(dayOfWeek))) {
        workDay = salon.workingHours.get(String(dayOfWeek));
    }

    if (!workDay || !workDay.isOpen) return true; // Closed

    // Check Open/Close bounds
    const openTime = new Date(`${dateStr}T${workDay.open}:00`);
    const closeTime = new Date(`${dateStr}T${workDay.close}:00`);
    
    // Note: Simple comparison works if dates are correct.
    // If times wrap around midnight this logic fails, but for a salon 9-18 it's fine.
    if (startDateTime < openTime || endDateTime > closeTime) return true;

    // Check Breaks
    if (workDay.breaks) {
        for (const brk of workDay.breaks) {
            const breakStart = new Date(`${dateStr}T${brk.start}:00`);
            const breakEnd = new Date(`${dateStr}T${brk.end}:00`);
            if (startDateTime < breakEnd && endDateTime > breakStart) return true;
        }
    }

    // 2. Check Appointments
    const appointmentConflict = await Appointment.findOne({
        salonId,
        professionalId,
        startTime: { $lt: endDateTime },
        endTime: { $gt: startDateTime },
        status: { $ne: 'cancelled' }
    });
    if (appointmentConflict) return true;

    // 3. Check Blocks (Global + Professional)
    const blockConflict = await Block.findOne({
        salonId,
        $or: [
            { professionalId: professionalId },
            { professionalId: null },
            { professionalId: { $exists: false } }
        ],
        startTime: { $lt: endDateTime },
        endTime: { $gt: startDateTime }
    });
    if (blockConflict) return true;

    return false;
};

// Exported Methods

const calcularDuracaoServicos = async (servicosIds) => {
    const ids = Array.isArray(servicosIds) ? servicosIds : [servicosIds];
    const services = await Service.find({ _id: { $in: ids } });
    if (services.length === 0) throw new Error('Serviços não encontrados');
    return services.reduce((acc, curr) => acc + curr.duration, 0);
};

/**
 * Orchestrates the creation of an appointment
 * Validates availability, calculates price, handles customer lookup/creation, and saves to DB.
 */
const createAppointment = async ({ salao_id, profissional_id, cliente, telefone, data, hora_inicio, servicos, origin = 'client' }) => {
    // 1. Calculate Duration and End Time
    const duracaoTotal = await calcularDuracaoServicos(servicos);
    const horaFim = somarMinutos(hora_inicio, duracaoTotal);

    // 2. Check for Conflicts
    const conflito = await existeConflito(
        salao_id, 
        profissional_id, 
        data, 
        hora_inicio, 
        horaFim
    );

    if (conflito) {
        throw new Error('Horário indisponível');
    }

    // 3. Customer Handling (Find or Create)
    const cleanPhone = telefone.replace(/\D/g, '');
    
    // Try to find existing by clean or raw phone
    let customer = await Customer.findOne({ 
        salonId: salao_id, 
        $or: [{ phone: cleanPhone }, { phone: telefone }] 
    });

    if (!customer) {
        // Create new customer with CLEAN phone
        customer = await Customer.create({
            salonId: salao_id,
            name: cliente,
            phone: cleanPhone, // Always save clean
            lastAppointment: new Date()
        });
    } else {
        // Update name if provided and different (optional, but keeps data fresh)
        let updated = false;
        if (cliente && customer.name !== cliente) {
            customer.name = cliente;
            updated = true;
        }
        
        // Ensure phone is normalized if it wasn't
        if (customer.phone !== cleanPhone) {
            customer.phone = cleanPhone;
            updated = true;
        }

        customer.lastAppointment = new Date();
        await customer.save();
    }

    // 4. Prepare Data
    const startDateTime = new Date(`${data}T${hora_inicio}:00`);
    const endDateTime = new Date(`${data}T${horaFim}:00`);

    const servicesDocs = await Service.find({ _id: { $in: servicos } });
    const totalPrice = servicesDocs.reduce((acc, s) => acc + s.price, 0);

    // 5. Save to DB
    const newAppointment = new Appointment({
        salonId: salao_id,
        professionalId: profissional_id,
        customerId: customer._id,
        services: servicesDocs.map(s => ({
            _id: s._id,
            name: s.name,
            price: s.price,
            duration: s.duration
        })),
        date: startDateTime,
        hora_inicio: hora_inicio,
        hora_fim: horaFim,
        startTime: startDateTime,
        endTime: endDateTime,
        totalPrice,
        customerName: cliente,
        customerPhone: telefone,
        origin
    });

    await newAppointment.save();
    return newAppointment;
};

const getServices = async (salonId) => {
    return await Service.find({ salonId });
};

module.exports = {
    createAppointment,
    getServices
};
