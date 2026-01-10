const mongoose = require('mongoose');

const salonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false, // Changed from true
    sparse: true,    // Allow nulls to be unique (if multiple nulls)
  },
  password: {
    type: String,
    required: false, // Changed from true
  },
  phone: String,
  address: String,
  logo: String, // URL
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  workingHours: {
    type: Map,
    of: new mongoose.Schema({
      open: String, // "09:00"
      close: String, // "18:00"
      isOpen: Boolean,
      isArrivalOrder: { type: Boolean, default: false },
      breaks: [{
        start: String,
        end: String    // "13:00"
      }]
    }),
    default: {}
  },
  settings: {
    slotInterval: { type: Number, default: 30 },
    appointmentBuffer: { type: Number, default: 0 }, // Minutes between appointments
    minNoticeMinutes: { type: Number, default: 60 }, // Minimum notice
    maxFutureDays: { type: Number, default: 30 },    // How far in future
  },
  chatConfig: {
    botBubbleColor: { type: String, default: '#F3F4F6' }, // Gray-100
    botTextColor: { type: String, default: '#1F2937' },   // Gray-800
    userBubbleColor: { type: String, default: '#3B82F6' }, // Blue-500
    userTextColor: { type: String, default: '#FFFFFF' },   // White
    buttonColor: { type: String, default: '#3B82F6' },     // Blue-500
    backgroundColor: { type: String, default: '#F9FAFB' }, // Gray-50
    headerColor: { type: String, default: '#FFFFFF' },     // White
    headerTextColor: { type: String, default: '#1F2937' }, // Gray-800
    assistantName: { type: String, default: 'Assistente' },
    assistantTone: { type: String, enum: ['formal', 'neutro', 'informal'], default: 'neutro' },
    avatarUrl: { type: String, default: '' },
    showAvatar: { type: Boolean, default: true },
    enableSuccessMeme: { type: Boolean, default: true },
    successMemeUrl: { type: String, default: 'https://media.tenor.com/8ZDLU43omvcAAAAM/kid-thumbs-up.gif' }
  },
  cancellationPolicy: String,
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN'],
    default: 'ADMIN'
  },
  active: {
    type: Boolean,
    default: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to generate slug
salonSchema.pre('save', async function(next) {
  if (!this.slug && this.name) {
    let baseSlug = this.name
      .toString()
      .toLowerCase()
      .normalize('NFD') // Separate accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '-') // Spaces to hyphens
      .replace(/[^\w\-]+/g, '') // Remove non-word chars
      .replace(/\-\-+/g, '-') // Collapse dashes
      .replace(/^-+/, '') // Trim starting dash
      .replace(/-+$/, ''); // Trim ending dash

    if (!baseSlug) baseSlug = 'salao';

    // Check for uniqueness
    let slug = baseSlug;
    let counter = 1;
    const Salon = mongoose.model('Salon');
    
    while (await Salon.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Virtual for chatbot link
salonSchema.virtual('chatbotLink').get(function() {
  if (!this.slug) return null;
  // Assuming frontend is served on same domain or we can use env var
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Adjust as needed
  return `${baseUrl}/chat/${this.slug}`;
});

// Ensure virtuals are included in JSON
salonSchema.set('toJSON', { virtuals: true });
salonSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Salon', salonSchema);
