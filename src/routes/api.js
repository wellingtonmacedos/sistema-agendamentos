const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const adminController = require('../controllers/adminController');
const reportController = require('../controllers/reportController');
const authController = require('../controllers/authController');
const customerController = require('../controllers/customerController');
const { authMiddleware, checkRole } = require('../middlewares/authMiddleware');
const userManagementController = require('../controllers/userManagementController');
const pushController = require('../controllers/pushController');
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

router.get('/admin/appointments/latest', authMiddleware, appointmentController.getLatestAppointmentTimestamp);
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

// Push Routes
router.get('/push/vapid-public-key', pushController.getVapidPublicKey);
router.post('/push/subscribe', authMiddleware, pushController.subscribe);

// Public Push Routes (for Client PWA/Frontend)
router.get('/public/push/vapid-public-key', pushController.getVapidPublicKey);
router.post('/public/push/subscribe', pushController.publicSubscribe);

// Helper route to get salon info (protected)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const Salon = require('../models/Salon');
        const salon = await Salon.findById(req.user.salonId);

        if (!salon) return res.status(404).json({ error: 'Salão não encontrado' });
        
        res.json({
            id: salon._id,
            userId: req.user.id,
            name: salon.name,
            userName: req.user.name,
            email: salon.email,
            userEmail: req.user.email,
            role: req.user.role,
            phone: salon.phone,
            address: salon.address,
            cancellationPolicy: salon.cancellationPolicy,
            workingHours: salon.workingHours,
            settings: salon.settings,
            emailSettings: salon.emailSettings,
            chatConfig: salon.chatConfig,
            slug: salon.slug,
            chatbotLink: salon.chatbotLink
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar dados do salão' });
    }
});

// Public: Get Chat Config (from first available salon or default)
router.get('/public/config', async (req, res) => {
    try {
        const Salon = require('../models/Salon');
        const { salao_id, slug } = req.query;
        
        let query = { 
            active: true, 
            deletedAt: null,
            role: { $ne: 'SUPER_ADMIN' }
        };

        if (salao_id) {
            query._id = salao_id;
        } else if (slug) {
            query.slug = slug;
        }

        // Get specific salon or first active one
        const salon = await Salon.findOne(query);
        
        if (salon) {
            const config = salon.chatConfig ? salon.chatConfig.toObject() : {};
            // Inject salon info for context
            config.salonId = salon._id;
            config.salonName = salon.name;
            config.slug = salon.slug;
            res.json(config);
        } else {
            // Default config if no salon or no config
            res.json({}); 
        }
    } catch (error) {
        console.error("Error fetching public config:", error);
        res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
});

// Helper endpoint to resolve slug to salon ID (for frontend routing)
router.get('/public/salon/:slug', async (req, res) => {
    try {
        const Salon = require('../models/Salon');
        const { slug } = req.params;
        
        const salon = await Salon.findOne({ 
            slug: slug, 
            active: true, 
            deletedAt: null 
        }).select('_id name slug chatbotLink settings chatConfig phone workingHours address');

        if (!salon) {
            return res.status(404).json({ error: 'Estabelecimento não encontrado' });
        }

        res.json(salon);
    } catch (error) {
        console.error("Error resolving salon slug:", error);
        res.status(500).json({ error: 'Erro ao buscar estabelecimento' });
    }
});


const productController = require('../controllers/productController');

// --- Product Routes ---
router.post('/admin/products', authMiddleware, productController.createProduct);
router.get('/admin/products', authMiddleware, productController.getProducts);
router.put('/admin/products/:id', authMiddleware, productController.updateProduct);
router.delete('/admin/products/:id', authMiddleware, productController.deleteProduct);

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
