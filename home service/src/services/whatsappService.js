const axios = require('axios');

// ── CallMeBot (FREE WhatsApp API) ─────────────────────────────────────
// Setup: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// 1. Add +34 644 59 71 23 on WhatsApp
// 2. Send: "I allow callmebot to send me messages"
// 3. You'll receive your API key
// ─────────────────────────────────────────────────────────────────────

async function sendWhatsApp(phone, message) {
  try {
    const apiKey = process.env.CALLMEBOT_API_KEY;
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
    const res = await axios.get(url, { timeout: 8000 });
    console.log(`✅ WhatsApp sent to ${phone}`);
    return { success: true, data: res.data };
  } catch (err) {
    console.error(`❌ WhatsApp failed to ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── Notify owner about new booking ───────────────────────────────────
async function notifyOwner(booking) {
  const msg =
`🔔 *New HomeServe Booking!*

📋 ID: ${booking.bookingId}
👤 Name: ${booking.name}
📞 Phone: ${booking.phone}
🛠 Service: ${booking.service}
📅 Date: ${booking.date} ${booking.time || ''}
📍 City: ${booking.city}
💳 Payment: ${booking.payment?.method || 'UPI'}

Reply to confirm!`;

  return sendWhatsApp(process.env.OWNER_PHONE, msg);
}

// ── Notify customer about booking confirmation ────────────────────────
async function notifyCustomer(booking) {
  const msg =
`✅ *Booking Received — HomeServe*

Hi ${booking.name}! Your booking is confirmed.

📋 ID: *${booking.bookingId}*
🛠 Service: ${booking.service}
📅 Date: ${booking.date}
📍 Location: ${booking.city}

We'll reach out within 30 mins to confirm your slot.
Save this ID for tracking! 🙌`;

  return sendWhatsApp(booking.phone, msg);
}

module.exports = { notifyOwner, notifyCustomer };
