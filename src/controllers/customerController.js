const Customer = require('../models/Customer');

const getCustomers = async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const query = { salonId: req.user.id }; // Scoped to current salon

        if (search) {
            const cleanSearch = search.replace(/\D/g, '');
            const conditions = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
            
            if (cleanSearch.length > 0) {
                 conditions.push({ phone: { $regex: cleanSearch, $options: 'i' } });
            }
            
            query.$or = conditions;
        }

        const customers = await Customer.find(query)
            .sort({ name: 1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Customer.countDocuments(query);

        res.json({
            customers,
            total,
            pages: Math.ceil(total / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { name, phone } = req.body;
        
        // Normalize phone
        const cleanPhone = phone.replace(/\D/g, '');

        // Check for duplicate phone in this salon
        const existing = await Customer.findOne({ 
            salonId: req.user.id, 
            phone: cleanPhone
        });

        if (existing) {
            return res.status(400).json({ error: 'Cliente já existe com este telefone.' });
        }

        const customer = new Customer({
            salonId: req.user.id,
            name,
            phone: cleanPhone
        });

        await customer.save();
        res.status(201).json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar cliente' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        const customer = await Customer.findOne({ _id: id, salonId: req.user.id });
        if (!customer) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // If phone changed, check uniqueness
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone !== customer.phone) {
                const existing = await Customer.findOne({ 
                    salonId: req.user.id, 
                    phone: cleanPhone
                });
                if (existing) {
                    return res.status(400).json({ error: 'Telefone já cadastrado para outro cliente.' });
                }
                customer.phone = cleanPhone;
            }
        }

        if (name) customer.name = name;
        
        await customer.save();
        res.json(customer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await Customer.findOneAndDelete({ _id: id, salonId: req.user.id });
        
        if (!customer) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        res.json({ message: 'Cliente excluído com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir cliente' });
    }
};

module.exports = {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
