import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max per file
    files: 4,                    // max 4 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

// NEW: wrap upload.array so multer errors are caught and returned with stable codes.
// Old app: never sees this — it receives the same message field as before.
// New app: additionally gets a `code` field for precise client-side handling.
export const uploadImages = (req, res, next) => {
  console.log('Multer middleware invoked');
  upload.array('images', 4)(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'One or more images exceed the 25MB file size limit.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Maximum 4 images allowed per product.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Unexpected file field received.',
      });
    }
    if (err.message === 'Only images allowed') {
      return res.status(400).json({
        code: 'INVALID_FILE_TYPE',
        message: 'Only image files are allowed.',
      });
    }

    // Unknown multer error — pass to Express global error handler
    next(err);
  });
};

export default upload;