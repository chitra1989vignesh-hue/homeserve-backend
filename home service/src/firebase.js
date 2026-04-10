const admin = require('firebase-admin');

let db, auth;

function initFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  db   = admin.firestore();
  auth = admin.auth();

  console.log('✅ Firebase connected');
}

function getDb()   { return db; }
function getAuth() { return auth; }

module.exports = { initFirebase, getDb, getAuth };
