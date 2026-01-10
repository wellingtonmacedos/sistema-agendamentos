// Notification Service Skeleton
// This service handles sending communications to customers (Email, WhatsApp, SMS)

// In the future, we will integrate with providers like:
// - Email: AWS SES, SendGrid, or Nodemailer
// - WhatsApp: Twilio, WPPConnect, or Meta API

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const sendEmail = async (to, subject, text) => {
    // Placeholder for email sending logic
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject} | Body: ${text}`);
    return true;
};

const sendWhatsApp = async (phone, message) => {
    // Placeholder for WhatsApp sending logic
    console.log(`[WHATSAPP MOCK] To: ${phone} | Message: ${message}`);
    return true;
};

const sendAppointmentConfirmation = async (appointment) => {
    try {
        const { customerName, date, startTime, salonId } = appointment;
        
        // Format date and time for friendly display
        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        const timeStr = new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const message = `Olá ${customerName}, seu agendamento foi confirmado para dia ${dateStr} às ${timeStr}.`;

        // Assuming we have customer email/phone. For now, we log.
        // In a real scenario, we would look up the customer's contact info.
        // Since our Appointment model currently stores 'customerName' as a string (simple MVP),
        // we might not have the email/phone directly unless we expand the model.
        
        // TODO: Expand Appointment model to include customerPhone/customerEmail or link to a Customer model.
        
        console.log(`[NOTIFICAÇÃO] Enviando confirmação para ${customerName}...`);
        await sendWhatsApp('5511999999999', message); // Mock phone
        
        return true;
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        return false;
    }
};

const sendPush = async (recipients, title, body, url) => {
    if (!recipients || recipients.length === 0) return;

    const payload = JSON.stringify({
        title,
        body,
        url
    });

    const promises = recipients.map(sub => {
        return webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: sub.keys
        }, payload).catch(err => {
            if (err.statusCode === 410 || err.statusCode === 404) {
                return PushSubscription.deleteOne({ _id: sub._id });
            }
            console.error('Erro ao enviar push:', err);
        });
    });

    await Promise.all(promises);
    console.log(`[PUSH] Enviado para ${recipients.length} dispositivos. (${title})`);
};

const sendPushToAdmins = async (appointment, type = 'NEW') => {
    try {
        const { salonId, customerName, date, startTime, customerPhone } = appointment;
        
        const admins = await User.find({ salonId, role: 'ADMIN' }); 
        const adminIds = admins.map(u => u._id);

        if (adminIds.length === 0) return;

        const subscriptions = await PushSubscription.find({ userId: { $in: adminIds } });

        if (subscriptions.length === 0) return;

        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        let title = '';
        let body = '';

        switch(type) {
            case 'NEW':
                title = 'Novo Agendamento';
                body = `${customerName} - ${dateStr} às ${startTime}`;
                break;
            case 'CANCEL':
                title = 'Agendamento Cancelado ❌';
                body = `${customerName} - ${dateStr} às ${startTime}`;
                break;
            case 'RESCHEDULE':
                title = 'Agendamento Alterado 🔄';
                body = `${customerName} mudou para ${dateStr} às ${startTime}`;
                break;
            case 'REMINDER':
                title = 'Lembrete de Atendimento ⏰';
                body = `${customerName} às ${startTime} (Em breve)`;
                break;
            default:
                title = 'Atualização na Agenda';
                body = `Verifique o agendamento de ${customerName}`;
        }

        await sendPush(subscriptions, title, body, '/admin');

    } catch (error) {
        console.error('Erro ao enviar push admin:', error);
    }
};

const sendPushToClient = async (appointment, type = 'CONFIRM') => {
    try {
        const { salonId, customerName, customerPhone, date, startTime } = appointment;
        
        if (!customerPhone) return;

        // Find subscriptions linked to this phone
        const subscriptions = await PushSubscription.find({ 
            salonId, 
            role: 'CLIENT',
            clientPhone: customerPhone 
        });

        if (subscriptions.length === 0) return;

        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        let title = '';
        let body = '';

        switch(type) {
            case 'CONFIRM':
                title = 'Agendamento Confirmado ✅';
                body = `Tudo certo para ${dateStr} às ${startTime}.`;
                break;
            case 'CANCEL':
                title = 'Agendamento Cancelado ❌';
                body = `Seu horário de ${dateStr} às ${startTime} foi cancelado.`;
                break;
            case 'RESCHEDULE':
                title = 'Horário Alterado 🔄';
                body = `Novo horário: ${dateStr} às ${startTime}.`;
                break;
            case 'REMINDER':
                title = 'Lembrete ⏰';
                body = `Seu horário é hoje às ${startTime}. Não se atrase!`;
                break;
            default:
                return;
        }

        // URL should open the Chatbot PWA
        // Since we don't know the slug here easily unless we populate salon, let's try to infer or pass it
        // Ideally appointment should have populated salon info or we fetch it.
        // For now, we assume root or a generic link, but the requirement is "PWA específico".
        // If the user installed the PWA from a specific salon link, the scope handles it.
        // We can just send '/' or '/my-appointments' if we had that view.
        // Let's send a deep link to the chat if possible? Or just focus.
        
        await sendPush(subscriptions, title, body, '/'); 

    } catch (error) {
        console.error('Erro ao enviar push cliente:', error);
    }
};

module.exports = {
    sendAppointmentConfirmation,
    sendWhatsApp,
    sendEmail,
    sendPushToAdmins,
    sendPushToClient
};
