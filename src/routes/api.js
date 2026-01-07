const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');
const userManagementController = require('../controllers/userManagementController');
const upload = require('../config/upload');

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Public: Availability & Booking
router.get('/disponibilidade/horarios', appointmentController.getAvailability);
router.post('/agendamentos', appointmentController.createAppointment);
router.get('/services', appointmentController.getServices);
router.get('/salons', appointmentController.getSalons);
router.get('/professionals', appointmentController.getProfessionals);
router.get('/customers/check', appointmentController.checkCustomer);
router.get('/my-appointments', appointmentController.getMyAppointments);
router.delete('/my-appointments/:id', appointmentController.cancelAppointment);
router.get('/agendamentos/:id/ics', appointmentController.downloadICS);

// Protected: Admin / Management Routes

router.get('/admin/customers', authMiddleware, customerController.getCustomers);
router.post('/admin/customers', authMiddleware, customerController.createCustomer);
router.put('/admin/customers/:id', authMiddleware, customerController.updateCustomer);
router.delete('/admin/customers/:id', authMiddleware, customerController.deleteCustomer);

router.put('/salon', authMiddleware, adminController.updateSalon);
router.get('/admin/reports', authMiddleware, reportController.getBillingReports);
router.put('/appointments/:id/finish', authMiddleware, adminController.finishAppointment);
router.put('/appointments/:id', authMiddleware, appointmentController.updateAppointment); // General update

router.post('/professionals', authMiddleware, adminController.createProfessional);
router.put('/professionals/:id', authMiddleware, adminController.updateProfessional);
router.delete('/professionals/:id', authMiddleware, adminController.deleteProfessional);

router.post('/services', authMiddleware, adminController.createService);
router.put('/services/:id', authMiddleware, adminController.updateService);
router.delete('/services/:id', authMiddleware, adminController.deleteService);

// Blocks CRUD
router.post('/blocks', authMiddleware, adminController.createBlock);
router.get('/blocks', authMiddleware, adminController.getBlocks);
router.delete('/blocks/:id', authMiddleware, adminController.deleteBlock);

// Helper route to get salon info (protected)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const salon = await require('../models/Salon').findById(req.user.id);
        if (!salon) return res.status(404).json({ error: 'Salão não encontrado' });
        
        // Return safe data
        res.json({
            id: salon._id,
            name: salon.name,
            email: salon.email,
            role: salon.role,
            workingHours: salon.workingHours,
            settings: salon.settings,
            chatConfig: salon.chatConfig // Include chatConfig
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do salão' });
    }
});

// Public: Get Chat Config (from first available salon or default)
router.get('/public/config', async (req, res) => {
    try {
        const Salon = require('../models/Salon');
        // Get the first active salon (excluding SUPER_ADMIN)
        const salon = await Salon.findOne({ 
            active: true, 
            deletedAt: null,
            role: { $ne: 'SUPER_ADMIN' }
        });
        
        if (salon && salon.chatConfig) {
            res.json(salon.chatConfig);
        } else {
            // Default config if no salon or no config
            res.json({}); 
        }
    } catch (error) {
        console.error("Error fetching public config:", error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});


router.get('/admin/appointments', authMiddleware, appointmentController.getAllAppointments);
router.delete('/admin/appointments/:id', authMiddleware, adminController.deleteAppointment);

// Super Admin Routes
router.get('/super-admin/users', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.listAdmins);
router.post('/super-admin/users', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.createAdmin);

// Upload Route
router.post('/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    // Return relative path accessible via /public/uploads
    const fileUrl = `/public/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

router.put('/super-admin/users/:id', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.updateAdmin);
router.delete('/super-admin/users/:id', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.deleteAdmin);
router.post('/super-admin/users/:id/reset-password', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.resetPassword);
router.get('/super-admin/audit-logs', authMiddleware, checkRole(['SUPER_ADMIN']), userManagementController.getAuditLogs);

module.exports = router;
