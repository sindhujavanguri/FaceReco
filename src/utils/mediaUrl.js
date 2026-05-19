const API_ORIGIN = 'https://api.apphrms.com';

export const normalizeMediaUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (
    trimmedValue.startsWith('http://') ||
    trimmedValue.startsWith('https://') ||
    trimmedValue.startsWith('file://') ||
    trimmedValue.startsWith('content://') ||
    trimmedValue.startsWith('data:')
  ) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith('//')) {
    return `https:${trimmedValue}`;
  }

  return `${API_ORIGIN}/${trimmedValue.replace(/^\/+/, '')}`;
};

export const getFaceProfileImageUrl = (profile = {}) =>
  normalizeMediaUrl(
    profile.face_image_path ||
      profile.face_image_url ||
      profile.face_image ||
      profile.image_url ||
      profile.image,
  );
