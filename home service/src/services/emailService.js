const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const serviceEmoji = {
  'House Cleaning': '🧹',
  'Electrician': '⚡',
  'Plumbing': '🔧',
  'Driver': '🚗'
};

// ── Customer confirmation email ──────────────────
async function sendCustomerConfirmation(booking) {
  const emoji = serviceEmoji[booking.service] || '✅';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:2rem auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#F97316;padding:2rem;text-align:center;">
      <h1 style="color:#fff;font-size:1.6rem;margin:0;font-weight:800;">HomeServe</h1>
      <p style="color:rgba(255,255,255,0.85);margin:.4rem 0 0;font-size:.9rem;">Booking Confirmed ✅</p>
    </div>
    <!-- Body -->
    <div style="padding:2rem;">
      <p style="font-size:1rem;color:#0F0F0F;">Hi <strong>${booking.name}</strong>,</p>
      <p style="color:#6B7280;line-height:1.7;margin:.5rem 0 1.5rem;">
        Your booking has been received! We'll confirm your slot within <strong>30 minutes</strong>.
      </p>
      <!-- Booking Card -->
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:14px;padding:1.5rem;margin-bottom:1.5rem;">
        <p style="font-size:.75rem;font-weight:700;color:#EA580C;letter-spacing:.1em;text-transform:uppercase;margin:0 0 1rem;">Booking Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;width:40%;">Booking ID</td>
            <td style="padding:.4rem 0;font-weight:700;color:#0F0F0F;font-size:.88rem;">${booking.bookingId}</td>
          </tr>
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;">Service</td>
            <td style="padding:.4rem 0;font-weight:600;color:#0F0F0F;font-size:.88rem;">${emoji} ${booking.service}</td>
          </tr>
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;">Date</td>
            <td style="padding:.4rem 0;font-weight:600;color:#0F0F0F;font-size:.88rem;">${booking.date}</td>
          </tr>
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;">Time</td>
            <td style="padding:.4rem 0;font-weight:600;color:#0F0F0F;font-size:.88rem;">${booking.time || 'To be confirmed'}</td>
          </tr>
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;">Location</td>
            <td style="padding:.4rem 0;font-weight:600;color:#0F0F0F;font-size:.88rem;">${booking.city}</td>
          </tr>
          <tr>
            <td style="padding:.4rem 0;color:#6B7280;font-size:.88rem;">Status</td>
            <td style="padding:.4rem 0;"><span style="background:#FED7AA;color:#EA580C;padding:.2rem .7rem;border-radius:50px;font-size:.78rem;font-weight:700;">Pending Confirmation</span></td>
          </tr>
        </table>
      </div>
      <p style="color:#6B7280;font-size:.88rem;line-height:1.6;">
        For quick help, WhatsApp us at <strong>+91 XXXXXXXXXX</strong> with your Booking ID.
      </p>
      <!-- CTA -->
      <div style="text-align:center;margin:1.8rem 0;">
        <a href="https://wa.me/91XXXXXXXXXX?text=Hi%20HomeServe!%20My%20booking%20ID%20is%20${booking.bookingId}"
           style="background:#25D366;color:#fff;padding:.8rem 2rem;border-radius:50px;text-decoration:none;font-weight:700;font-size:.95rem;">
          💬 Chat on WhatsApp
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="background:#f9f9f9;padding:1.2rem 2rem;text-align:center;border-top:1px solid #E5E7EB;">
      <p style="color:#9CA3AF;font-size:.78rem;margin:0;">© ${new Date().getFullYear()} HomeServe. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  return transporter.sendMail({
    from: `"HomeServe" <${process.env.EMAIL_USER}>`,
    to: booking.email,
    subject: `✅ Booking Confirmed — ${booking.service} | ${booking.bookingId}`,
    html
  });
}

// ── Owner alert email ──────────────────────────
async function sendOwnerAlert(booking) {
  const emoji = serviceEmoji[booking.service] || '✅';
  const html = `
<div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:1.5rem;border:2px solid #F97316;border-radius:16px;">
  <h2 style="color:#F97316;margin-top:0;">🔔 New Booking — ${emoji} ${booking.service}</h2>
  <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
    <tr><td style="padding:.4rem 0;color:#666;width:35%;">Booking ID</td><td style="font-weight:700;">${booking.bookingId}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Customer</td><td>${booking.name}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Phone</td><td>${booking.phone}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Email</td><td>${booking.email || 'Not provided'}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Service</td><td>${booking.service}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Date</td><td>${booking.date} ${booking.time || ''}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">City</td><td>${booking.city}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Address</td><td>${booking.address || '—'}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Notes</td><td>${booking.notes || '—'}</td></tr>
    <tr><td style="padding:.4rem 0;color:#666;">Payment</td><td>${booking.payment?.method || 'whatsapp_upi'}</td></tr>
  </table>
  <a href="https://wa.me/${booking.phone.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(booking.name)}!%20Your%20HomeServe%20booking%20(${booking.bookingId})%20for%20${encodeURIComponent(booking.service)}%20is%20confirmed."
     style="display:inline-block;margin-top:1rem;background:#25D366;color:#fff;padding:.6rem 1.5rem;border-radius:50px;text-decoration:none;font-weight:700;">
    Reply to Customer on WhatsApp
  </a>
</div>`;

  return transporter.sendMail({
    from: `"HomeServe Bookings" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `🔔 New Booking: ${booking.service} — ${booking.name} (${booking.bookingId})`,
    html
  });
}

module.exports = { sendCustomerConfirmation, sendOwnerAlert };
