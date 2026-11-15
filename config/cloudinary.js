const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const FOLDER = 'hm-trading';

// آپلود یک بافر به Cloudinary (با کوچک‌سازی و فشرده‌سازی خودکار)
function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1400, height: 1400, crop: 'limit', quality: 'auto', fetch_format: 'auto' }]
      },
      (err, result) => (err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id }))
    ).end(buffer);
  });
}

// حذف عکس (خطا را قورت می‌دهد تا حذف محصول متوقف نشود)
async function deleteImage(publicId) {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { invalidate: true }); }
  catch (e) { console.error('Cloudinary delete failed:', e.message); }
}

module.exports = { uploadBuffer, deleteImage };