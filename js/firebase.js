// EventMediaHub Firebase configuration.
// Replace the values below with your Firebase Web App config.
// NEVER put a Firebase Admin SDK/service-account private key in this file.

const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_FIREBASE_PROJECT.firebaseapp.com",
  projectId: "YOUR_FIREBASE_PROJECT_ID",
  storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

if (Object.values(firebaseConfig).some(v => String(v).includes("YOUR_FIREBASE"))) {
  console.warn("Configure js/firebase.js with your Firebase Web App config.");
}

firebase.initializeApp(firebaseConfig);
window.firebaseAuth = firebase.auth();
window.firebaseDb = firebase.firestore();
window.firebaseStorage = firebase.storage();

window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(console.warn);
