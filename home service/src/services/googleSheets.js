const { google } = require('googleapis');

// ── Setup ─────────────────────────────────────────────────────────────
// 1. Go to https://console.cloud.google.com
// 2. Create a project → Enable "Google Sheets API"
// 3. Create credentials → Service Account → Download JSON key
// 4. Share your Google Sheet with the service account email
// 5. Copy Sheet ID from the URL:
//    https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
// ─────────────────────────────────────────────────────────────────────

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ── Append a row to a specific sheet tab ─────────────────────────────
async function appendRow(sheetName, values) {
  try {
    const sheets = await getSheets();
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [values] }
    });
    console.log(`✅ Google Sheets: row added to "${sheetName}"`);
    return true;
  } catch (err) {
    console.error(`❌ Google Sheets error (${sheetName}):`, err.message);
    return false;
  }
}

// ── Ensure header rows exist ──────────────────────────────────────────
async function ensureHeaders() {
  try {
    const sheets = await getSheets();
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Check Bookings sheet
    const bookingsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Bookings!A1'
    });
    if (!bookingsRes.data.values) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Bookings!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Booking ID', 'Date Created', 'Customer Name', 'Phone', 'Email',
            'Service', 'Booking Date', 'Time', 'City', 'Address',
            'Notes', 'Payment Method', 'Payment Status', 'Booking Status'
          ]]
        }
      });
    }

    // Check Users sheet
    const usersRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Users!A1'
    });
    if (!usersRes.data.values) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Users!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[
            'Name', 'Email', 'Phone', 'City', 'Registered On'
          ]]
        }
      });
    }
  } catch (err) {
    console.error('Google Sheets header setup error:', err.message);
  }
}

// ── Log a new booking ─────────────────────────────────────────────────
async function logBooking(booking) {
  const values = [
    booking.bookingId,
    new Date(booking.createdAt).toLocaleString('en-IN'),
    booking.name,
    booking.phone,
    booking.email || '',
    booking.service,
    booking.date,
    booking.time || '',
    booking.city,
    booking.address || '',
    booking.notes || '',
    booking.payment?.method || 'whatsapp_upi',
    booking.payment?.status || 'pending',
    booking.status
  ];
  return appendRow('Bookings', values);
}

// ── Log a new user signup ─────────────────────────────────────────────
async function logUser(user) {
  const values = [
    user.name,
    user.email,
    user.phone,
    user.city || '',
    new Date(user.createdAt).toLocaleString('en-IN')
  ];
  return appendRow('Users', values);
}

module.exports = { logBooking, logUser, ensureHeaders };
