import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
     storage: storage,
     limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max file size
        files: 4, // Max 4 files
      }, 
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  },
});

export default upload;
