// Notification Service Skeleton
// This service handles sending communications to customers (Email, WhatsApp, SMS)

// In the future, we will integrate with providers like:
// - Email: AWS SES, SendGrid, or Nodemailer
// - WhatsApp: Twilio, WPPConnect, or Meta API

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const Salon = require('../models/Salon');
const Professional = require('../models/Professional');

// Configure Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || 'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const sendEmail = async (to, subject, html) => {
    // In production, integrate with SES/SendGrid/Nodemailer
    // For now, we just log to simulate sending
    console.log(`[EMAIL SIMULATION] ---------------------------------------------------`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "")}`);
    console.log(`----------------------------------------------------------------------`);
    return true;
};

const sendEmailNotification = async (appointment, type = 'NEW') => {
    try {
        const { salonId, professionalId, customerName, customerPhone, date, startTime, services } = appointment;
        
        // Fetch Salon Settings and Professional
        const salon = await Salon.findById(salonId);
        if (!salon) return;

        // Check Settings
        const settings = salon.emailSettings || {};
        const shouldNotify = type === 'NEW' 
            ? settings.notifyOnNewAppointment !== false // Default true
            : settings.notifyOnCancellation !== false; // Default true

        if (!shouldNotify) return;

        // Prepare Email Content
        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        // startTime is Date object in model, but sometimes string in flow? 
        // Model says Date, let's format it.
        const timeStr = new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const serviceNames = services.map(s => s.name).join(', ');
        
        let professionalName = 'Não atribuído';
        let professionalEmail = null;

        if (professionalId) {
            const professional = await Professional.findById(professionalId);
            if (professional) {
                professionalName = professional.name;
                professionalEmail = professional.email; // Assuming Professional has email
            }
        }

        const subjectPrefix = type === 'NEW' ? 'Novo agendamento recebido' : 'Agendamento cancelado';
        const subject = `${subjectPrefix} – ${customerName}`;

        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>${salon.name}</h2>
                <h3 style="color: ${type === 'NEW' ? '#10B981' : '#EF4444'};">
                    ${subjectPrefix}
                </h3>
                <p><strong>Cliente:</strong> ${customerName}</p>
                <p><strong>Telefone:</strong> ${customerPhone}</p>
                <p><strong>Data:</strong> ${dateStr}</p>
                <p><strong>Horário:</strong> ${timeStr}</p>
                <p><strong>Serviço(s):</strong> ${serviceNames}</p>
                <p><strong>Profissional:</strong> ${professionalName}</p>
                <br/>
                <p><small>Este é um email automático do Sistema de Agendamentos.</small></p>
            </div>
        `;

        // 1. Send to Salon Admin
        if (salon.email) {
            await sendEmail(salon.email, subject, html);
        }

        // 2. Send to Professional (Optional)
        if (settings.notifyProfessional && professionalEmail) {
            await sendEmail(professionalEmail, subject, html);
        }

    } catch (error) {
        console.error('Erro ao enviar email de notificação:', error);
    }
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
    sendPushToClient,
    sendEmailNotification
};
