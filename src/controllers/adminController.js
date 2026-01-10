const Salon = require('../models/Salon');
const Professional = require('../models/Professional');
const Service = require('../models/Service');
const Schedule = require('../models/Schedule');
const Block = require('../models/Block');
const Appointment = require('../models/Appointment');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// --- Salon Settings ---

exports.updateSalon = async (req, res) => {
  try {
    const updates = req.body;
    // Prevent updating sensitive fields like password directly here (should have separate route)
    delete updates.password;
    delete updates.email; // Usually email change requires verification

    // Ensure chatConfig is properly merged if present
    if (updates.chatConfig) {
        const salon = await Salon.findById(req.user.salonId);
        if (salon) {
             // Merge existing chatConfig with new updates to avoid overwriting nested fields if partial update
             // Mongoose Map/Object handling can be tricky with partial updates depending on how it's sent
             // But since we are likely sending the whole object from frontend, direct assignment might be okay.
             // However, let's be safe and merge.
             updates.chatConfig = { ...salon.chatConfig, ...updates.chatConfig };
        }
    }

    const salon = await Salon.findByIdAndUpdate(req.user.salonId, updates, { new: true });
    res.json(salon);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Professionals Management ---

exports.createProfessional = async (req, res) => {
  try {
    const professional = new Professional({ ...req.body, salonId: req.user.salonId });
    await professional.save();
    res.status(201).json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findOneAndUpdate(
      { _id: id, salonId: req.user.salonId },
      req.body,
      { new: true }
    );
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json(professional);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProfessional = async (req, res) => {
  try {
    const { id } = req.params;
    const professional = await Professional.findOneAndDelete({ _id: id, salonId: req.user.salonId });
    if (!professional) return res.status(404).json({ error: 'Profissional não encontrado' });
    res.json({ message: 'Profissional removido' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Services Management ---

exports.createService = async (req, res) => {
  try {
    const service = new Service({ ...req.body, salonId: req.user.salonId });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndUpdate(
      { _id: id, salonId: req.user.salonId },
      req.body,
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findOneAndDelete({ _id: id, salonId: req.user.salonId });
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
    res.json({ message: 'Serviço removido' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// --- Blocks Management ---

exports.createBlock = async (req, res) => {
    try {
        const { professionalId, startTime, endTime, reason, type } = req.body;
        // If professionalId is empty string or 'null', treat as undefined (global)
        const profId = (professionalId && professionalId !== 'null' && professionalId !== '') ? professionalId : undefined;

        const block = new Block({
            salonId: req.user.salonId,
            professionalId: profId,
            startTime,
            endTime,
            reason,
            type: type || 'BLOCK'
        });
        await block.save();
        res.status(201).json(block);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getBlocks = async (req, res) => {
    try {
        const blocks = await Block.find({ salonId: req.user.salonId }).populate('professionalId', 'name');
        res.json(blocks);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const block = await Block.findOneAndDelete({ _id: id, salonId: req.user.salonId });
        if (!block) return res.status(404).json({ error: 'Bloqueio não encontrado' });
        res.json({ message: 'Bloqueio removido' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// --- Reports ---

exports.getReports = async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start ? new Date(start) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = end ? new Date(end) : new Date();

        // Ensure endDate includes the whole day
        endDate.setHours(23, 59, 59, 999);

        console.log(`[Reports] Generating for Salon: ${req.user.salonId}`);
        console.log(`[Reports] Date Range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const dateFilter = {
            salonId: new mongoose.Types.ObjectId(req.user.salonId),
            status: 'completed', // Only completed/finished appointments
            realEndTime: { $gte: startDate, $lte: endDate } // Filter by real end time
        };

        // Debug: Check matching documents count
        const count = await Appointment.countDocuments(dateFilter);
        console.log(`[Reports] Found ${count} completed appointments in range.`);

        // 1. Total Revenue & Appointments
        // Use finalPrice if available, otherwise fallback to totalPrice (though business rule says finalPrice is set on finish)
        const totalStats = await Appointment.aggregate([
            { $match: dateFilter },
            { 
                $group: { 
                    _id: null, 
                    totalRevenue: { $sum: { $ifNull: ["$finalPrice", "$totalPrice"] } },
                    totalAppointments: { $sum: 1 }
                } 
            }
        ]);
        
        console.log('[Reports] Total Stats:', totalStats);

        // 2. Revenue by Service
        const serviceStats = await Appointment.aggregate([
            { $match: dateFilter },
            { $unwind: "$services" },
            {
                $group: {
                    _id: "$services.name",
                    revenue: { $sum: "$services.price" }, 
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: "$revenue",
                    count: 1
                }
            }
        ]);

        // 3. Revenue by Professional
        const professionalStats = await Appointment.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: "professionals",
                    localField: "professionalId",
                    foreignField: "_id",
                    as: "professional"
                }
            },
            { $unwind: "$professional" },
            {
                $group: {
                    _id: "$professional.name",
                    revenue: { $sum: { $ifNull: ["$finalPrice", "$totalPrice"] } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: "$revenue",
                    count: 1
                }
            }
        ]);

        // 4. Revenue by Product
        const productStats = await Appointment.aggregate([
            { $match: dateFilter },
            { $unwind: "$products" },
            {
                $group: {
                    _id: "$products.name",
                    revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
                    count: { $sum: "$products.quantity" }
                }
            },
            { $sort: { revenue: -1 } },
            {
                $project: {
                    _id: 0,
                    name: "$_id",
                    value: "$revenue",
                    count: 1
                }
            }
        ]);

        // Calculate Average Ticket
        const totalRev = totalStats[0]?.totalRevenue || 0;
        const totalAppts = totalStats[0]?.totalAppointments || 0;
        const averageTicket = totalAppts > 0 ? totalRev / totalAppts : 0;

        res.json({
            summary: {
                totalRevenue: totalRev,
                totalAppointments: totalAppts,
                averageTicket: averageTicket
            },
            byService: serviceStats,
            byProfessional: professionalStats,
            byProduct: productStats
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatórios' });
    }
};

exports.finishAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { finalPrice, paymentMethod, products } = req.body;
        
        console.log(`[Admin] Finishing appointment ${id}`);
        console.log(`[Admin] Payload - FinalPrice: ${finalPrice}, Method: ${paymentMethod}`);
        console.log(`[Admin] Payload - Products:`, JSON.stringify(products));

        if (!paymentMethod) {
            return res.status(400).json({ error: 'Forma de pagamento é obrigatória para finalizar o atendimento.' });
        }

        const validPaymentMethods = ['money', 'pix', 'credit_card', 'debit_card'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ error: 'Forma de pagamento inválida.' });
        }

        const appointment = await Appointment.findOne({ _id: id, salonId: req.user.salonId });
        
        if (!appointment) {
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }
        
        if (appointment.status === 'completed') {
             return res.status(400).json({ error: 'Agendamento já foi finalizado e não pode ser alterado.' });
        }

        // --- Stock Validation & Deduction ---
        const usedProducts = [];
        if (products && Array.isArray(products) && products.length > 0) {
            for (const item of products) {
                const product = await Product.findOne({ _id: item.productId, salonId: req.user.salonId });
                
                if (!product) {
                    return res.status(400).json({ error: `Produto não encontrado: ${item.name}` });
                }
                
                if (!product.active) {
                    return res.status(400).json({ error: `Produto inativo: ${product.name}` });
                }

                if (product.stock < item.quantity) {
                    return res.status(400).json({ error: `Estoque insuficiente para o produto: ${product.name}. Disponível: ${product.stock}` });
                }

                usedProducts.push({
                    productDoc: product,
                    quantity: item.quantity,
                    price: item.price
                });
            }

            // Deduct stock
            for (const item of usedProducts) {
                item.productDoc.stock -= item.quantity;
                await item.productDoc.save();
                
                // Add to appointment products list
                appointment.products.push({
                    productId: item.productDoc._id,
                    name: item.productDoc.name,
                    price: item.price,
                    quantity: item.quantity
                });
            }
        }

        appointment.status = 'completed';
        appointment.realEndTime = new Date();
        appointment.paymentMethod = paymentMethod;
        
        if (finalPrice !== undefined) {
            appointment.finalPrice = Number(finalPrice);
        } else {
            appointment.finalPrice = appointment.totalPrice;
        }
        
        await appointment.save();
        console.log(`[Admin] Appointment finished. Status: ${appointment.status}, Final Price: ${appointment.finalPrice}`);
        res.json(appointment);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao finalizar atendimento' });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { cancelFuture } = req.query;
        console.log(`[Admin] Deleting appointment ${id} for salon ${req.user.salonId}, cancelFuture: ${cancelFuture}`);

        const appointment = await Appointment.findOne({ _id: id, salonId: req.user.salonId });
        
        if (!appointment) {
            console.log(`[Admin] Appointment ${id} not found or not owned by salon ${req.user.salonId}`);
            return res.status(404).json({ error: 'Agendamento não encontrado' });
        }

        if (cancelFuture === 'true' && appointment.recurrenceId) {
            await Appointment.deleteMany({
                recurrenceId: appointment.recurrenceId,
                startTime: { $gte: appointment.startTime },
                salonId: req.user.salonId
            });
            console.log(`[Admin] Deleted recurring series from ${appointment.startTime}`);
        } else {
            await Appointment.findByIdAndDelete(id);
            console.log(`[Admin] Appointment ${id} deleted successfully`);
        }

        res.json({ message: 'Agendamento excluído com sucesso' });
    } catch (error) {
        console.error(`[Admin] Error deleting appointment:`, error);
        res.status(500).json({ error: 'Erro ao excluir agendamento: ' + error.message });
    }
};
