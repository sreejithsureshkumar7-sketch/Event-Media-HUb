// EventMediaHub uses Firebase Anonymous Authentication.
// There is NO visible login, Google login, or account creation flow.
window.EMH = window.EMH || {};

EMH.auth = {
  async user() {
    if (window.firebaseAuth.currentUser) return window.firebaseAuth.currentUser;
    return new Promise((resolve, reject) => {
      const unsubscribe = window.firebaseAuth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user || null);
      }, reject);
    });
  },

  async ensureAnonymousUser() {
    const current = await this.user();
    if (current) return current;
    const result = await window.firebaseAuth.signInAnonymously();
    return result.user;
  },

  async requireUser() {
    return this.ensureAnonymousUser();
  },

  async profile() {
    const user = await this.ensureAnonymousUser();
    const ref = window.firebaseDb.collection("profiles").doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) return { id: snap.id, ...snap.data() };

    const profile = {
      full_name: "Event Guest",
      email: null,
      avatar_url: null,
      role: "participant",
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(profile, { merge: true });
    return { id: user.uid, ...profile };
  }
};

window.firebaseAuth.onAuthStateChanged(user => {
  window.dispatchEvent(new CustomEvent("emh-auth", { detail: user }));
});
