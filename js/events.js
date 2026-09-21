window.EMH = window.EMH || {};

const eventCollection = () => window.firebaseDb.collection("events");
const eventData = (doc) => ({ id: doc.id, ...doc.data() });

EMH.events = {
  async list() {
    const snap = await eventCollection().orderBy("starts_at", "desc").get();
    return snap.docs.map(eventData);
  },

  async byId(id) {
    const snap = await eventCollection().doc(id).get();
    if (!snap.exists) throw new Error("Event not found.");
    return eventData(snap);
  },

  async byCode(code) {
    const snap = await eventCollection().where("join_code", "==", code.toUpperCase()).limit(1).get();
    if (snap.empty) throw new Error("Event code not found.");
    return eventData(snap.docs[0]);
  },

  async join(eventId) {
    const user = await EMH.auth.requireUser();
    const id = `${eventId}_${user.uid}`;
    await window.firebaseDb.collection("event_members").doc(id).set({
      event_id: eventId,
      user_id: user.uid,
      device_label: navigator.userAgent.slice(0, 120),
      joined_at: firebase.firestore.FieldValue.serverTimestamp(),
      last_seen_at: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  },

  async create(payload) {
    const user = await EMH.auth.requireUser();
    const join_code = (crypto.randomUUID().replace(/-/g, "").slice(0, 8)).toUpperCase();
    const ref = await eventCollection().add({
      ...payload,
      created_by: user.uid,
      join_code,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    const snap = await ref.get();
    return eventData(snap);
  },

  async update(id, payload) {
    await eventCollection().doc(id).update(payload);
    return this.byId(id);
  },

  async remove(id) {
    const media = await window.firebaseDb.collection("media").where("event_id", "==", id).get();
    const batch = window.firebaseDb.batch();
    media.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(eventCollection().doc(id));
    await batch.commit();
  },

  async members(eventId) {
    const snap = await window.firebaseDb.collection("event_members")
      .where("event_id", "==", eventId)
      .orderBy("joined_at", "desc").get();
    const rows = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      const p = await window.firebaseDb.collection("profiles").doc(data.user_id).get();
      rows.push({ id: doc.id, ...data, profiles: p.exists ? { id: p.id, ...p.data() } : null });
    }
    return rows;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (!document.body.dataset.page?.includes("events")) return;
  await EMH.pageGuard();
  const list = document.querySelector("#eventList");
  if (!list) return;

  try {
    const events = await EMH.events.list();
    list.innerHTML = events.map(e => {
      const expired = new Date(e.ends_at) < new Date();
      return `<article class="card event-card">
        <div class="event-art">${expired ? "⌛" : "🎉"}</div>
        <div class="card-body">
          <span class="pill">${expired ? "Expired" : "Active"}</span>
          <h3>${EMH.escape(e.name)}</h3>
          <p>${EMH.escape(e.venue || "College campus")}</p>
          <small>${EMH.formatDate(e.starts_at)} → ${EMH.formatDate(e.ends_at)}</small>
          <div class="actions">
            <a class="btn primary" href="event.html?event=${e.id}">Open Event</a>
            <a class="btn ghost" href="gallery.html?event=${e.id}">Gallery</a>
          </div>
        </div>
      </article>`;
    }).join("") || `<div class="empty">No events yet.</div>`;
  } catch (err) {
    list.innerHTML = `<div class="empty">Could not load events: ${EMH.escape(err.message)}</div>`;
  }
});
