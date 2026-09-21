package com.eventmediahub.sync

/**
 * Architecture scaffold for EventMediaHub background media sync.
 *
 * Backend split:
 * - Firebase Auth + Firestore for identity/event/media metadata.
 * - Cloudinary for the actual image/video bytes.
 *
 * A production Android implementation should:
 * 1. Use WorkManager for periodic/retryable work.
 * 2. Query MediaStore for new media.
 * 3. Read the selected eventId from encrypted/local app storage.
 * 4. POST multipart data to Cloudinary:
 *    https://api.cloudinary.com/v1_1/hqsg0uz5/image/upload
 *    or
 *    https://api.cloudinary.com/v1_1/hqsg0uz5/video/upload
 *    with upload_preset=eventmediahub.
 * 5. After a successful Cloudinary response, create the Firestore `media` document.
 * 6. Persist a sync checkpoint and retry failures with WorkManager backoff.
 *
 * This file intentionally contains no Firebase service-account key or Cloudinary API Secret.
 */
class SyncWorker {
    companion object {
        const val CLOUD_NAME = "hqsg0uz5"
        const val UPLOAD_PRESET = "eventmediahub"
    }
}
