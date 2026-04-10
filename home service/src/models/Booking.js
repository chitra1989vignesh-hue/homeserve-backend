const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    default: () => 'HS-' + Date.now().toString(36).toUpperCase()
  },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  service: {
    type: String,
    required: true,
    enum: ['House Cleaning', 'Electrician', 'Plumbing', 'Driver']
  },
  date: { type: String, required: true },
  time: { type: String },
  city: { type: String, required: true },
  address: { type: String },
  notes: { type: String },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  payment: {
    method: { type: String, enum: ['razorpay', 'whatsapp_upi', 'cash'], default: 'whatsapp_upi' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    amount: Number
  },
  notificationsSent: {
    customerEmail: { type: Boolean, default: false },
    ownerWhatsapp: { type: Boolean, default: false },
    customerWhatsapp: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
