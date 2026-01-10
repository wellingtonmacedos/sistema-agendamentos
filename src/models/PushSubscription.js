const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional now, as Clients don't have User ID initially
    },
    salonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        required: true
    },
    role: {
        type: String,
        enum: ['ADMIN', 'CLIENT'],
        default: 'ADMIN'
    },
    clientPhone: {
        type: String, // Used for Clients to link notifications
        required: false
    },
    endpoint: {
        type: String,
        required: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure one subscription per endpoint per user (or just endpoint unique is enough usually)
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
PushSubscriptionSchema.index({ userId: 1, salonId: 1 });

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
