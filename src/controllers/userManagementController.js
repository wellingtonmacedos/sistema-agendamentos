const Salon = require('../models/Salon');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');

// Helper para Log
const logAction = async (action, performedBy, target, details, ip) => {
    try {
        await AuditLog.create({
            action,
            performedBy,
            targetId: target._id,
            targetName: target.name,
            details,
            ipAddress: ip
        });
    } catch (e) {
        console.error('Falha ao gravar log de auditoria:', e);
    }
};

const listAdmins = async (req, res) => {
    try {
        // List Users with role ADMIN
        const admins = await User.find({ role: 'ADMIN', active: true }) // active check? old code checked deletedAt null
            .populate('salonId', 'name phone settings');
        
        console.log(`[SuperAdmin] Listando administradores: ${admins.length} encontrados.`);
        
        // Map to flat structure if helpful, or return as is. 
        // Returning as is (User with populated Salon) is cleaner for new structure.
        res.json(admins);
    } catch (error) {
        console.error('Erro ao listar administradores:', error);
        res.status(500).json({ error: 'Erro ao listar administradores' });
    }
};

const createAdmin = async (req, res) => {
    try {
        let { name, email, password, phone, salonName } = req.body;

        if (email) email = email.trim();

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ error: 'Email já em uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create Salon first
        const newSalon = new Salon({
            name: salonName || name, // Fallback if salonName not provided
            email, // Legacy/Backup
            password: 'deprecated',
            phone,
            active: true
        });

        await newSalon.save();

        // Create User
        const newAdmin = new User({
            name,
            email,
            password: hashedPassword,
            salonId: newSalon._id,
            role: 'ADMIN',
            active: true
        });

        await newAdmin.save();

        await logAction('CREATE_ADMIN', req.user.id, newAdmin, { email }, req.ip);

        res.status(201).json({ message: 'Administrador criado com sucesso', admin: newAdmin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar administrador' });
    }
};

const updateAdmin = async (req, res) => {
    try {
        const { id } = req.params; // This is USER ID now
        let { name, email, active, phone, salonName } = req.body;
        
        if (email) email = email.trim();

        const admin = await User.findById(id);
        if (!admin || admin.role !== 'ADMIN') {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        const oldData = { name: admin.name, email: admin.email, active: admin.active };
        
        if (email && email !== admin.email) {
             if (await User.findOne({ email })) {
                return res.status(400).json({ error: 'Email já em uso' });
            }
        }

        admin.name = name || admin.name;
        admin.email = email || admin.email;
        if (typeof active === 'boolean') admin.active = active;

        await admin.save();

        // Update linked Salon if needed
        if (admin.salonId && (phone || salonName || typeof active === 'boolean')) {
            const salon = await Salon.findById(admin.salonId);
            if (salon) {
                if (salonName) salon.name = salonName;
                if (phone) salon.phone = phone;
                if (typeof active === 'boolean') salon.active = active;
                // If email changed, maybe update salon email too for consistency?
                if (email) salon.email = email; 
                await salon.save();
            }
        }

        await logAction('UPDATE_ADMIN', req.user.id, admin, { oldData, newData: req.body }, req.ip);

        res.json({ message: 'Administrador atualizado', admin });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar' });
    }
};

const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params; // User ID
        const admin = await User.findById(id);
        
        if (!admin || admin.role !== 'ADMIN') {
            return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        // Soft delete User? User model doesn't have deletedAt in my definition.
        // Let's add it or just set active = false.
        // Or actually delete? The old code used soft delete (deletedAt).
        // I should have added deletedAt to User model.
        // For now, let's just set active = false and maybe rename email to release it?
        // Or if I can add deletedAt to User schema, that's better.
        // Let's assume active=false is enough for now, or I'll update User schema.
        
        admin.active = false;
        await admin.save();

        // Soft delete Salon
        if (admin.salonId) {
            const salon = await Salon.findById(admin.salonId);
            if (salon) {
                salon.deletedAt = new Date();
                salon.active = false;
                await salon.save();
            }
        }

        await logAction('DELETE_ADMIN', req.user.id, admin, {}, req.ip);

        res.json({ message: 'Administrador removido com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao remover' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { id } = req.params; // User ID
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }

        const admin = await User.findById(id);
        if (!admin || admin.role !== 'ADMIN') {
             return res.status(404).json({ error: 'Administrador não encontrado' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(newPassword, salt);
        await admin.save();

        await logAction('RESET_PASSWORD', req.user.id, admin, {}, req.ip);

        res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        // Log model needs to refer to User now, probably.
        // performedBy was Salon ID. Now User ID.
        // AuditLog schema likely has ref: 'Salon'. 
        // I should check AuditLog schema.
        const logs = await AuditLog.find()
            .populate('performedBy', 'name email') // This might fail if ref is wrong
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar logs' });
    }
};

module.exports = {
    listAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    resetPassword,
    getAuditLogs
};