export const validateSession = async (req, res, next) => {
    if (!req.session.admin?.timestamp || 
        Date.now() - req.session.admin.timestamp > 3600000) { // 1 hour
      await new Promise((resolve) => req.session.destroy(resolve));
      return res.status(401).json({ message: "Session expired" });
    }
    next();
};