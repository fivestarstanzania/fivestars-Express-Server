export const validateUploadLimit = (req, res, next) => {
    const { uploadLimit } = req.body;
    if (!Number.isInteger(uploadLimit) || uploadLimit < 1 || uploadLimit > 30) {
      return res.status(400).json({ message: "Upload limit must be an integer between 1 and 30." });
    }
    next();
};