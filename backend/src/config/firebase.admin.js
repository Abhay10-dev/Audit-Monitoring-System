// Firebase Admin SDK configuration for the Node.js backend
// Loaded from environment variables — never commit real keys

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle surrounding quotes, spaces, and escaped newlines robustly
      privateKey:  process.env.FIREBASE_PRIVATE_KEY
        ?.trim()
        ?.replace(/^["']|["']$/g, '') // Remove leading/trailing quotes
        ?.replace(/\\n/g, '\n'),      // Replace literal \n with actual newlines
    }),
  });
}

/**
 * Verify a Firebase ID token and return the decoded token payload.
 * @param {string} idToken - The Firebase ID token from the client
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
const verifyFirebaseToken = async (idToken) => {
  return admin.auth().verifyIdToken(idToken);
};

module.exports = { admin, verifyFirebaseToken };
