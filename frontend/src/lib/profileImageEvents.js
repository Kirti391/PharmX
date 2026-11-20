export const PROFILE_IMAGE_UPDATED_EVENT = "pharmx:profile-image-updated";

export function announceProfileImageUpdated(imageUrl) {
  window.dispatchEvent(
    new CustomEvent(PROFILE_IMAGE_UPDATED_EVENT, {
      detail: { imageUrl },
    })
  );
}
