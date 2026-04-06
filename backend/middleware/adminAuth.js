const admin = require('firebase-admin');
const { User } = require('../models');

const initFirebaseAdmin = () => {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
};

const extractBearerToken = (req) => {
  const auth = req.headers?.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
};

module.exports = async function adminOnly(req, res, next) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: 'Missing bearer token' });
    }

    initFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decoded.uid);
    const email = userRecord.email || decoded.email;

    if (!email) {
      return res.status(401).json({ success: false, error: 'No email mapped to Firebase user' });
    }

    const dbUser = await User.findOne({ where: { email } });
    if (!dbUser || !dbUser.isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden - admin access required' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      isAdmin: dbUser.isAdmin,
      uid: decoded.uid,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid firebase token',
      details: err?.message || 'Unauthorized',
    });
  }
};