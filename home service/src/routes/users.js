const express = require('express');
const router  = express.Router();
const { getDb, getAuth } = require('../firebase');
const { verifyToken } = require('../middleware/auth');
const { logUser } = require('../services/googleSheets');

// ── POST /api/users/register — Save profile after Firebase signup ─────
// Firebase Auth handles actual registration on the frontend.
// This just saves the extra profile data to Firestore.
router.post('/register', verifyToken, async (req, res) => {
  try {
    const { name, phone, city, address } = req.body;
    const uid   = req.user.uid;
    const email = req.user.email;

    const profile = {
      uid, name, email,
      phone:   phone   || '',
      city:    city    || '',
      address: address || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await getDb().collection('users').doc(uid).set(profile, { merge: true });

    // Log to Google Sheets (non-blocking)
    logUser(profile).catch(e => console.error('Sheets user err:', e.message));

    res.status(201).json({ success: true, message: 'Profile saved', user: profile });
  } catch (err) {
    console.error('Register err:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/users/me — Get own profile + stats ──────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await getDb().collection('users').doc(uid).get();

    if (!doc.exists) return res.status(404).json({ success: false, message: 'Profile not found' });

    // Get booking count and last booking
    const bookingsSnap = await getDb()
      .collection('users').doc(uid).collection('bookings')
      .orderBy('createdAt', 'desc').limit(5).get();

    const recentBookings = bookingsSnap.docs.map(d => d.data());
    const totalBookings  = bookingsSnap.size;

    // Update last login
    await getDb().collection('users').doc(uid).update({ lastLogin: new Date().toISOString() });

    res.json({
      success: true,
      user: doc.data(),
      stats: { totalBookings },
      recentBookings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PATCH /api/users/me — Update profile ────────────────────────────
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name, phone, city, address } = req.body;
    const updates = {};
    if (name)    updates.name    = name;
    if (phone)   updates.phone   = phone;
    if (city)    updates.city    = city;
    if (address) updates.address = address;

    await getDb().collection('users').doc(req.user.uid).update(updates);
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

// ── GET /api/users — Admin: list all users ───────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const snap = await getDb().collection('users')
      .orderBy('createdAt', 'desc')
      .limit(200)
      .get();
    const users = snap.docs.map(d => d.data());
    res.json({ success: true, users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
