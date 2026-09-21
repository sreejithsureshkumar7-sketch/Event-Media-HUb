window.EMH = window.EMH || {};

EMH.gallery = {
  async load(eventId) {
    const snap = await window.firebaseDb.collection("media")
      .where("event_id", "==", eventId)
      .get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(row => row.status !== "deleted");
  },

  subscribe(eventId, render) {
    return window.firebaseDb.collection("media")
      .where("event_id", "==", eventId)
      .onSnapshot(snapshot => render({ docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(row => row.status !== "deleted") }));
  },

  async render(rows, host, isAdmin=false) {
    host.innerHTML = "";
    for (const row of rows.sort((a,b) => ((b.created_at?.seconds || 0) - (a.created_at?.seconds || 0)))) {
      try {
        const url = await EMH.upload.signedUrl(row);
        const media = row.media_type === "video"
          ? `<video src="${url}" controls preload="metadata"></video>`
          : `<img src="${url}" alt="${EMH.escape(row.original_name || "Event photo")}" loading="lazy">`;
        host.insertAdjacentHTML("beforeend", `<article class="media-card" data-id="${row.id}">
          ${media}
          <div class="media-meta">
            <span>${row.media_type}</span>
            <small>${EMH.formatDate(row.created_at?.toDate ? row.created_at.toDate() : row.created_at)}</small>
            <a class="btn tiny" href="${url}" target="_blank" download>Download</a>
            ${row.media_type === "video" ? `<a class="btn tiny" href="editor.html?event=${row.event_id}&media=${row.id}">Edit</a>` : ""}
            ${isAdmin ? `<button class="btn tiny danger" data-delete="${row.id}">Delete</button>` : ""}
          </div>
        </article>`);
      } catch (e) {
        console.warn("Media URL error", e);
      }
    }
    if (!host.children.length) host.innerHTML = `<div class="empty">No media yet. Upload the first memory.</div>`;
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  if (document.body.dataset.page !== "gallery") return;
  const { profile } = await EMH.pageGuard();
  const eventId = EMH.getEventId();
  if (!eventId) return;
  const host = document.querySelector("#galleryGrid");
  let rows = await EMH.gallery.load(eventId);
  await EMH.gallery.render(rows, host, profile?.role === "admin");

  EMH.gallery.subscribe(eventId, async payload => {
    rows = payload.docs;
    await EMH.gallery.render(rows, host, profile?.role === "admin");
  });

  host.addEventListener("click", async e => {
    const id = e.target.dataset.delete;
    if (!id) return;
    const row = rows.find(x => x.id === id);
    if (!row || !confirm("Delete this media permanently?")) return;
    try {
      await EMH.upload.remove(row);
      EMH.toast("Media deleted", "success");
    } catch (err) { EMH.toast(err.message, "error"); }
  });
});
