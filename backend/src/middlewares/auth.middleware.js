const { verifyFirebaseToken } = require('../config/firebase.admin');
const { query } = require('../db/db');

/**
 * Middleware to verify Firebase ID Token from the Authorization header.
 * Attaches the decoded user payload to req.user.
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // Fetch user details from our DB to get their role and internal ID
    const { rows } = await query(
      'SELECT id, role, is_active FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    if (rows.length === 0) {
      // User authenticated in Firebase but doesn't exist in our DB yet
      // We still attach the firebase uid to let the login route create the user
      req.user = { firebase_uid: decodedToken.uid, email: decodedToken.email };
      return next();
    }

    const dbUser = rows[0];

    if (!dbUser.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    // Attach full user context to request
    req.user = {
      id: dbUser.id,
      firebase_uid: decodedToken.uid,
      email: decodedToken.email,
      role: dbUser.role,
    };

    next();
  } catch (error) {
    console.error('Firebase Auth Error:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized', 
      detail: error.message 
    });
  }
};

module.exports = { requireAuth };
