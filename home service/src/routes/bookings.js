const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { getDb } = require('../firebase');
const { verifyToken } = require('../middleware/auth');
const { sendCustomerConfirmation, sendOwnerAlert } = require('../services/emailService');
const { notifyOwner, notifyCustomer } = require('../services/whatsappService');
const { logBooking } = require('../services/googleSheets');

const SERVICE_PRICES = {
  'House Cleaning': 499,
  'Electrician':    349,
  'Plumbing':       299,
  'Driver':         199
};

// Generate booking ID
function genBookingId() {
  return 'HS-' + Date.now().toString(36).toUpperCase();
}

// ── POST /api/bookings — Create booking ──────────────────────────────
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name required'),
    body('phone').trim().notEmpty().withMessage('Phone required'),
    body('service').isIn(Object.keys(SERVICE_PRICES)).withMessage('Invalid service'),
    body('date').notEmpty().withMessage('Date required'),
    body('city').trim().notEmpty().withMessage('City required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { name, phone, email, service, date, time, city, address, notes, paymentMethod, uid } = req.body;

      const bookingId = genBookingId();
      const booking = {
        bookingId,
        name, phone, email: email || '',
        service, date, time: time || '',
        city, address: address || '',
        notes: notes || '',
        status: 'pending',
        payment: {
          method: paymentMethod || 'whatsapp_upi',
          status: 'pending',
          amount: SERVICE_PRICES[service]
        },
        userId: uid || null,
        createdAt: new Date().toISOString()
      };

      // Save to Firestore
      const db = getDb();
      await db.collection('bookings').doc(bookingId).set(booking);

      // If user is logged in, add to their subcollection too
      if (uid) {
        await db.collection('users').doc(uid).collection('bookings').doc(bookingId).set(booking);
      }

      // Notifications + Google Sheets (non-blocking)
      Promise.allSettled([
        email ? sendCustomerConfirmation(booking).catch(e => console.error('Email err:', e.message)) : null,
        sendOwnerAlert(booking).catch(e => console.error('Owner email err:', e.message)),
        notifyOwner(booking).catch(e => console.error('WA owner err:', e.message)),
        notifyCustomer(booking).catch(e => console.error('WA customer err:', e.message)),
        logBooking(booking).catch(e => console.error('Sheets err:', e.message)),
      ]);

      res.status(201).json({
        success: true,
        message: 'Booking created!',
        booking: { bookingId, service, date, status: 'pending' }
      });

    } catch (err) {
      console.error('Booking error:', err);
      res.status(500).json({ success: false, message: 'Server error. Try again.' });
    }
  }
);

// ── GET /api/bookings/:bookingId — Track booking (public) ────────────
router.get('/:bookingId', async (req, res) => {
  try {
    const doc = await getDb().collection('bookings').doc(req.params.bookingId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Booking not found' });
    const data = doc.data();
    // Return limited fields for public tracking
    res.json({ success: true, booking: {
      bookingId: data.bookingId, service: data.service, date: data.date,
      time: data.time, city: data.city, status: data.status,
      payment: { method: data.payment.method, status: data.payment.status }
    }});
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/bookings/user/me — Get logged-in user's bookings ────────
router.get('/user/me', verifyToken, async (req, res) => {
  try {
    const snap = await getDb()
      .collection('users').doc(req.user.uid)
      .collection('bookings')
      .orderBy('createdAt', 'desc')
      .get();

    const bookings = snap.docs.map(d => d.data());
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/bookings — Admin: all bookings ──────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, service } = req.query;
    let ref = getDb().collection('bookings').orderBy('createdAt', 'desc');
    if (status)  ref = ref.where('status', '==', status);
    if (service) ref = ref.where('service', '==', service);

    const snap = await ref.limit(100).get();
    const bookings = snap.docs.map(d => d.data());
    res.json({ success: true, bookings, total: bookings.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/bookings/:bookingId/status — Update status ────────────
router.patch('/:bookingId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','confirmed','in-progress','completed','cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    await getDb().collection('bookings').doc(req.params.bookingId).update({ status });
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
