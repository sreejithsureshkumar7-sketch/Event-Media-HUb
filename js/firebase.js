// EventMediaHub Firebase + Cloudinary configuration.
// Paste the EXACT firebaseConfig object copied from Firebase Console when you registered the Web App.
// Do NOT put Firebase Admin SDK / service-account private keys here.

const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY",
  authDomain: "PASTE_YOUR_FIREBASE_AUTH_DOMAIN",
  projectId: "PASTE_YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "PASTE_YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "PASTE_YOUR_FIREBASE_APP_ID"
};

const cloudinaryConfig = {
  cloudName: "hqsg0uz5",
  uploadPreset: "eventmediahub"
};

const missingFirebaseConfig = Object.values(firebaseConfig).some(v => String(v).startsWith("PASTE_YOUR_"));
if (missingFirebaseConfig) {
  console.warn("EventMediaHub: paste your Firebase Web App config into js/firebase.js.");
}

window.EMH = window.EMH || {};
window.EMH.config = { firebase: firebaseConfig, cloudinary: cloudinaryConfig };

firebase.initializeApp(firebaseConfig);
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();

window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
