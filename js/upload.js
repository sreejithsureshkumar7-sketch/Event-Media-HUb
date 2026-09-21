window.EMH = window.EMH || {};

EMH.upload = {
  async file(eventId, file, onProgress) {
    const user = await EMH.auth.requireUser();
    const isVideo = file.type.startsWith("video/");
    const bucket = isVideo ? "videos" : "photos";
    const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
    const objectPath = `${bucket}/${eventId}/${user.uid}/${crypto.randomUUID()}.${ext}`;
    const storageRef = window.firebaseStorage.ref(objectPath);

    onProgress?.(10);
    await storageRef.put(file, { contentType: file.type });
    onProgress?.(75);

    const mediaRef = window.firebaseDb.collection("media").doc();
    const payload = {
      event_id: eventId,
      uploaded_by: user.uid,
      bucket,
      object_path: objectPath,
      media_type: isVideo ? "video" : "photo",
      mime_type: file.type,
      original_name: file.name,
      size_bytes: file.size,
      duration_seconds: null,
      status: "active",
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await mediaRef.set(payload);
    } catch (error) {
      await storageRef.delete().catch(() => {});
      throw error;
    }
    onProgress?.(100);
    return { id: mediaRef.id, ...payload };
  },

  async signedUrl(row) {
    return window.firebaseStorage.ref(row.object_path).getDownloadURL();
  },

  async remove(row) {
    await window.firebaseStorage.ref(row.object_path).delete().catch(() => {});
    await window.firebaseDb.collection("media").doc(row.id).delete();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector("#mediaInput");
  const eventId = EMH.getEventId();
  const list = document.querySelector("#uploadList");
  if (!input || !eventId) return;

  input.onchange = async () => {
    for (const file of [...input.files]) {
      const item = document.createElement("div");
      item.className = "upload-item";
      item.innerHTML = `<span>${EMH.escape(file.name)}</span><progress value="0" max="100"></progress>`;
      list?.prepend(item);
      try {
        await EMH.upload.file(eventId, file, p => item.querySelector("progress").value = p);
        item.querySelector("span").textContent += " ✓";
      } catch (err) {
        item.querySelector("span").textContent += ` — ${err.message}`;
      }
    }
    input.value = "";
  };
});
