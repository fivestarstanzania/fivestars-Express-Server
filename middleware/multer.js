import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
     storage: storage,
     limits: {
        fileSize: 25 * 1024 * 1024, // 25MB max file size
      }, 
});

export default upload;
