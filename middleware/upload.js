const multer = require('multer');
const path = require('path');

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 7 }, // 5MB هر عکس، حداکثر 7 فایل
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED.includes(ext) && /^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG and WEBP images are allowed.'));
  }
});

// بررسی "امضای" واقعی فایل (magic bytes)
function isRealImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP';
  return jpg || png || webp;
}

upload.verify = (req, res, next) => {
  const files = Object.values(req.files || {}).flat();
  if (files.some(f => !isRealImage(f.buffer))) {
    return res.status(400).json({ message: 'Invalid or corrupted image file.' });
  }
  next();
};

module.exports = upload;