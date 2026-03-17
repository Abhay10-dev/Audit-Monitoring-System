// Firebase Admin SDK configuration for the Node.js backend
// Loaded from environment variables — never commit real keys

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace \n escape in env variable with actual newlines
      privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
