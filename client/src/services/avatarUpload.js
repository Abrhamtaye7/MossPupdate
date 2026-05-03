import Axios from 'axios';

const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxSize = 5 * 1024 * 1024;

const resizeToSquare = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 300, 300);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob);
        else reject(new Error('Failed to resize image'));
      }, file.type);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });

export const uploadAvatar = async (file, onProgress) => {
  if (!file) {
    throw new Error('Avatar file is required.');
  }
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Unsupported file type.');
  }
  if (file.size > maxSize) {
    throw new Error('File must be smaller than 5MB.');
  }

  const resized = await resizeToSquare(file);
  const formData = new FormData();
  formData.append('avatar', resized, file.name);

  const res = await Axios.post('/api/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return res.data;
};
