import multer from 'multer';

// Use memory storage to hold files in RAM temporarily.
// This prevents automatic upload to Cloudinary before validation.
const storage = multer.memoryStorage();

// File filter to ensure only images are processed
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit 5MB per file
  }
});

export default upload;