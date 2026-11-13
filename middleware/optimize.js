const sharp = require('sharp');
const fs = require('fs/promises');
const path = require('path');

sharp.cache(false); // جلوگیری از قفل شدن فایل در ویندوز

// عکس را کوچک می‌کند (حداکثر 1400px) و با همان فرمت فشرده ذخیره می‌کند.
// این کار فایل‌های جعلی (غیر عکس) را هم رد می‌کند و اطلاعات مخفی (EXIF/GPS) را پاک می‌کند.
module.exports = async function optimizeImages(req, res, next) {
  const files = Object.values(req.files || {}).flat();
  try {
    for (const f of files) {
      const ext = path.extname(f.filename).toLowerCase();
      let img = sharp(f.path).rotate()
        .resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true });
      if (ext === '.png') img = img.png({ compressionLevel: 9 });
      else if (ext === '.webp') img = img.webp({ quality: 80 });
      else img = img.jpeg({ quality: 80, mozjpeg: true });
      await fs.writeFile(f.path, await img.toBuffer());
    }
    next();
  } catch (e) {
    await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
    res.status(400).json({ message: 'Invalid or corrupted image file.' });
  }
};