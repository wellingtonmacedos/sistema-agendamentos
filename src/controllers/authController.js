const Salon = require('../models/Salon');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const login = async (req, res) => {
  try {
    const { password } = req.body;
    let { email } = req.body;

    // Normalize email
    if (email) email = email.trim();

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Try finding User first (New Flow)
    const user = await User.findOne({ email });
    
    if (user) {
        if (!user.active) {
            return res.status(403).json({ error: 'Conta desativada.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        // Get Salon info to return in response (legacy compat)
        let salon = null;
        if (user.salonId) {
            salon = await Salon.findById(user.salonId);
        }

        const token = jwt.sign(
            { id: user._id, salonId: user.salonId, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({
            message: 'Login realizado com sucesso',
            token,
            salon: salon ? {
                id: salon._id,
                name: salon.name,
                email: salon.email,
                role: salon.role, // Legacy
                settings: salon.settings,
                workingHours: salon.workingHours,
                chatConfig: salon.chatConfig
            } : {},
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                salonId: user.salonId
            }
        });
    }

    // Fallback: Check Salon collection (Old Flow - should be migrated, but just in case)
    const salon = await Salon.findOne({ email });
    if (!salon) {
      return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // ... (rest of legacy login logic if needed, or just fail)
    // Since we ran migration, we expect User to exist.
    // But let's keep the old logic valid for now just in case migration failed or something.
    
    if (!salon.active || salon.deletedAt) {
        return res.status(400).json({ error: 'Conta inválida' });
    }

    const isMatch = await bcrypt.compare(password, salon.password);
    if (!isMatch) {
        return res.status(400).json({ error: 'Credenciais inválidas' });
    }

    // Create a User on the fly if missing? No, that's what migration script did.
    // Just return token as before but warn.
    // Actually, let's assume migration worked. If not found in User, fail.
    return res.status(400).json({ error: 'Usuário não migrado ou não encontrado.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
};

module.exports = {
  login
};
