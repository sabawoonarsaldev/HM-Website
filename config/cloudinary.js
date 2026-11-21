const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const FOLDER = 'hm-trading';
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp';
const TRANSFORM = 'c_limit,h_1400,w_1400,q_auto'; // کوچک‌سازی هنگام آپلود

// امضای کوتاه‌مدت برای آپلود مستقیم از مرورگر
function signUpload() {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder: FOLDER,
    allowed_formats: ALLOWED_FORMATS,
    transformation: TRANSFORM
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return {
    signature, timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: CLOUD,
    folder: FOLDER,
    allowedFormats: ALLOWED_FORMATS,
    transformation: TRANSFORM
  };
}

// فقط آدرس‌های واقعی Cloudinary خودمان قبول می‌شود
function isValidImage(url, publicId) {
  if (typeof url !== 'string' || typeof publicId !== 'string') return false;
  if (!publicId.startsWith(FOLDER + '/') || publicId.length > 200) return false;
  if (!/^[A-Za-z0-9_\-\/]+$/.test(publicId)) return false;
  return url.startsWith(`https://res.cloudinary.com/${CLOUD}/`) && url.length <= 500;
}

async function deleteImage(publicId) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { invalidate: true }); }
  catch (e) { console.error('Cloudinary delete failed:', e.message); }
}

module.exports = { signUpload, isValidImage, deleteImage, FOLDER };