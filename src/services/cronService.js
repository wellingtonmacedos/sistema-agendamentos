const Appointment = require('../models/Appointment');
const notificationService = require('./notificationService');

const start = () => {
    console.log('[CRON] Service Started');
    
    // Run every 15 minutes
    setInterval(checkReminders, 15 * 60 * 1000);
    
    // Initial run
    checkReminders();
};

const checkReminders = async () => {
    try {
        const now = new Date();
        
        // 1. Admin Reminders (approx 24h before)
        // Find appointments starting between 23h and 25h from now that haven't been reminded
        const start24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const end24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
        
        const appts24h = await Appointment.find({
            startTime: { $gte: start24h, $lte: end24h },
            'reminders.admin24h': { $ne: true },
            status: 'confirmed'
        });
        
        if (appts24h.length > 0) {
            console.log(`[CRON] Processing ${appts24h.length} admin reminders (24h)`);
            for (const appt of appts24h) {
                await notificationService.sendPushToAdmins(appt, 'REMINDER');
                appt.reminders.admin24h = true;
                await appt.save();
            }
        }
        
        // 2. Client Reminders (approx 2h before)
        // Find appointments starting between 1h30m and 2h30m from now
        const start2h = new Date(now.getTime() + 90 * 60 * 1000); // 1.5h
        const end2h = new Date(now.getTime() + 150 * 60 * 1000); // 2.5h
        
        const appts2h = await Appointment.find({
            startTime: { $gte: start2h, $lte: end2h },
            'reminders.client2h': { $ne: true },
            status: 'confirmed'
        });
        
        if (appts2h.length > 0) {
            console.log(`[CRON] Processing ${appts2h.length} client reminders (2h)`);
            for (const appt of appts2h) {
                await notificationService.sendPushToClient(appt, 'REMINDER');
                appt.reminders.client2h = true;
                await appt.save();
            }
        }
        
    } catch (error) {
        console.error('[CRON] Error processing reminders:', error);
    }
};

module.exports = { start };
