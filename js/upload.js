window.EMH = window.EMH || {};

const cloudinaryUpload = async (file, onProgress) => {
  const { cloudName, uploadPreset } = window.EMH.config.cloudinary;
  const isVideo = file.type.startsWith("video/");
  const resourceType = isVideo ? "video" : "image";
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/${resourceType}/upload`;
  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  form.append("context", `eventmediahub=true|original_name=${file.name}`);

  onProgress?.(10);
  const response = await fetch(endpoint, { method: "POST", body: form });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error?.message || `Cloudinary upload failed (${response.status})`);
  }
  onProgress?.(75);
  return { ...result, resource_type: resourceType };
};

EMH.upload = {
  async file(eventId, file, onProgress) {
    const user = await EMH.auth.requireUser();
    if (!file || !(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      throw new Error("Only image and video files are supported.");
    }

    const isVideo = file.type.startsWith("video/");
    const result = await cloudinaryUpload(file, onProgress);
    const mediaRef = window.firebaseDb.collection("media").doc();

    const payload = {
      event_id: eventId,
      uploaded_by: user.uid,
      media_type: isVideo ? "video" : "photo",
      mime_type: file.type,
      original_name: file.name,
      size_bytes: file.size,
      duration_seconds: null,
      status: "active",
      provider: "cloudinary",
      cloudinary_public_id: result.public_id || null,
      cloudinary_asset_id: result.asset_id || null,
      cloudinary_resource_type: result.resource_type,
      cloudinary_format: result.format || null,
      cloudinary_version: result.version || null,
      secure_url: result.secure_url,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await mediaRef.set(payload);
    } catch (error) {
      // Cloudinary unsigned browser uploads cannot safely destroy an asset from the client.
      // Keep the upload but surface the database error so it can be cleaned up from Cloudinary later.
      throw new Error(`Uploaded to Cloudinary, but Firestore save failed: ${error.message}`);
    }

    onProgress?.(100);
    return { id: mediaRef.id, ...payload };
  },

  async signedUrl(row) {
    if (!row.secure_url) throw new Error("Media URL is missing.");
    return row.secure_url;
  },

  async remove(row) {
    // Unsigned Cloudinary uploads cannot be destroyed safely from a public browser.
    // Mark the Firestore record deleted; use Cloudinary console/server-side cleanup for asset deletion.
    await window.firebaseDb.collection("media").doc(row.id).update({
      status: "deleted",
      deleted_at: firebase.firestore.FieldValue.serverTimestamp(),
      deleted_by: (await EMH.auth.requireUser()).uid
    });
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
