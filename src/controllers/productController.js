const Product = require('../models/Product');
const Appointment = require('../models/Appointment');

// Create a new product
exports.createProduct = async (req, res) => {
    try {
        const { name, price, stock, commission, active } = req.body;
        
        const product = new Product({
            salonId: req.user.salonId,
            name,
            price,
            stock,
            commission,
            active
        });

        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao criar produto: ' + error.message });
    }
};

// Get all products for the salon
exports.getProducts = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const filter = { salonId: req.user.salonId };
        
        if (activeOnly === 'true') {
            filter.active = true;
        }

        const products = await Product.find(filter).sort({ name: 1 });
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
};

// Update a product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.salonId; // Prevent changing owner

        const product = await Product.findOneAndUpdate(
            { _id: id, salonId: req.user.salonId },
            updates,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Erro ao atualizar produto' });
    }
};

// Delete a product (soft delete or check usage first)
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product was used in any appointment
        const used = await Appointment.exists({ 'products.productId': id });
        if (used) {
            return res.status(400).json({ error: 'Este produto já foi utilizado em atendimentos e não pode ser excluído. Você pode inativá-lo.' });
        }

        const product = await Product.findOneAndDelete({ _id: id, salonId: req.user.salonId });

        if (!product) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        res.json({ message: 'Produto excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
};
