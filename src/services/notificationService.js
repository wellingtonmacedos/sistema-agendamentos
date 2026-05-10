// Notification Service Skeleton
// This service handles sending communications to customers (Email, WhatsApp, SMS)

// In the future, we will integrate with providers like:
// - Email: AWS SES, SendGrid, or Nodemailer
// - WhatsApp: Twilio, WPPConnect, or Meta API

const webpush = require('web-push');
const nodemailer = require('nodemailer');
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

let emailTransport = null;

if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

const sendEmail = async (to, subject, html) => {
    if (!to) return false;

    if (!emailTransport) {
        console.log(`[EMAIL SIMULATION] ---------------------------------------------------`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${html.replace(/<br>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "")}`);
        console.log(`----------------------------------------------------------------------`);
        return true;
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await emailTransport.sendMail({
        from,
        to,
        subject,
        html
    });

    console.log(`[EMAIL] Enviado para ${to}`);
    return true;
};

const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const value = email.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const sendEmailNotification = async (appointment, type = 'NEW') => {
    try {
        const { salonId, professionalId, customerName, customerPhone, date, startTime, services } = appointment;
        
        const salon = await Salon.findById(salonId);
        if (!salon) return;

        const settings = salon.emailSettings || {};
        const adminShouldNotify = type === 'NEW'
            ? settings.notifyOnNewAppointment !== false
            : type === 'CANCEL'
                ? settings.notifyOnCancellation !== false
                : false;

        const professionalShouldNotify = type === 'NEW'
            ? (settings.professionalNotifyOnNewAppointment ?? settings.notifyProfessional ?? true) !== false
            : type === 'CANCEL'
                ? (settings.professionalNotifyOnCancellation ?? false) === true
                : type === 'RESCHEDULE'
                    ? (settings.professionalNotifyOnReschedule ?? false) === true
                    : false;

        const dateStr = new Date(date).toLocaleDateString('pt-BR');
        const timeStr = new Date(startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const serviceNames = Array.isArray(services) ? services.map(s => s?.name).filter(Boolean).join(', ') : '';
        
        let professionalName = 'Não atribuído';
        let professionalEmail = null;
        let professionalOkForSalon = false;

        if (professionalId && professionalShouldNotify) {
            const professional = await Professional.findById(professionalId);
            if (professional) {
                professionalName = professional.name;
                professionalEmail = professional.email;
                professionalOkForSalon = String(professional.salonId) === String(salon._id);
            }
        }

        const subjectPrefix = type === 'NEW'
            ? 'Novo atendimento agendado'
            : type === 'CANCEL'
                ? 'Atendimento cancelado'
                : type === 'RESCHEDULE'
                    ? 'Atendimento reagendado'
                    : 'Atualização de atendimento';

        const subject = `${subjectPrefix} – ${dateStr} ${timeStr}`;

        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="padding: 16px; border: 1px solid #E5E7EB; border-radius: 12px;">
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom: 8px;">
                        ${salon.logo ? `<img src="${salon.logo}" alt="${salon.name}" style="width:40px; height:40px; border-radius:10px; object-fit:cover;" />` : ''}
                        <div>
                            <div style="font-size: 18px; font-weight: 700; color: #111827;">${salon.name}</div>
                            <div style="font-size: 13px; color: #6B7280;">${subjectPrefix}</div>
                        </div>
                    </div>

                    <div style="margin-top: 12px; padding: 12px; background:#F9FAFB; border-radius: 10px;">
                        <div style="font-size: 14px; line-height: 1.6;">
                            <div><strong>Cliente:</strong> ${customerName}</div>
                            <div><strong>Telefone:</strong> ${customerPhone}</div>
                            <div><strong>Serviço(s):</strong> ${serviceNames}</div>
                            <div><strong>Data:</strong> ${dateStr}</div>
                            <div><strong>Horário:</strong> ${timeStr}</div>
                            <div><strong>Profissional:</strong> ${professionalName}</div>
                        </div>
                    </div>

                    <div style="margin-top: 12px; font-size: 12px; color: #6B7280;">
                        Este é um email automático do Sistema de Agendamentos.
                    </div>
                </div>
            </div>
        `;

        if (adminShouldNotify && isValidEmail(salon.email)) {
            await sendEmail(salon.email, subject, html);
        }

        if (professionalShouldNotify && professionalOkForSalon && isValidEmail(professionalEmail)) {
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
