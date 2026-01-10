const PushSubscription = require('../models/PushSubscription');

exports.getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res) => {
    try {
        const { subscription, role, clientPhone, salonId: paramSalonId } = req.body;
        
        let userId = null;
        let salonId = null;
        let userRole = role || 'ADMIN';

        // Determine Context
        if (req.user) {
            // Authenticated (Admin)
            userId = req.user.id;
            salonId = req.user.salonId;
            userRole = 'ADMIN';
        } else {
            // Public (Client)
            // Expect salonId passed from frontend (e.g. from the loaded public salon context)
            if (!paramSalonId) {
                return res.status(400).json({ error: 'Salon ID obrigatório para clientes.' });
            }
            salonId = paramSalonId;
            userRole = 'CLIENT';
        }

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ error: 'Assinatura inválida.' });
        }

        // Check if subscription already exists
        let existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

        if (existing) {
            // Update metadata
            if (userId) existing.userId = userId;
            existing.salonId = salonId;
            existing.role = userRole;
            existing.keys = subscription.keys;
            if (clientPhone) existing.clientPhone = clientPhone;
            
            await existing.save();
        } else {
            // Create new
            await PushSubscription.create({
                userId,
                salonId,
                role: userRole,
                clientPhone: clientPhone || null,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            });
        }

        res.status(201).json({ message: 'Inscrição para notificações realizada com sucesso.' });
    } catch (error) {
        console.error('Erro ao salvar inscrição push:', error);
        res.status(500).json({ error: 'Erro interno ao salvar inscrição.' });
    }
};

exports.publicSubscribe = exports.subscribe; // Alias for public route
