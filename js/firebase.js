// EventMediaHub Firebase + Cloudinary configuration.
// Paste the EXACT firebaseConfig object copied from Firebase Console when you registered the Web App.
// Do NOT put Firebase Admin SDK / service-account private keys here.

const firebaseConfig = {
  apiKey: "AIzaSyCGzg-qLKi2VvysGoTE7sPe8Ea98nKUJ4E",
  authDomain: "eventmediahub-c6bf4.firebaseapp.com",
  projectId: "eventmediahub-c6bf4",
  storageBucket: "eventmediahub-c6bf4.firebasestorage.app",
  messagingSenderId: "163373167010",
  appId: "1:163373167010:web:c58864112ce10572d2c2fb",
  measurementId: "G-LZBV5WQFB2"
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
