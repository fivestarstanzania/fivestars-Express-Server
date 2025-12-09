// ============================
// Sanitize & Validate Update Data
// ============================
export const sanitizeProductUpdate = (req, res, next) => {
  const body = req.body;

  // Allowed fields only (mass assignment protection)
  const allowed = [
    "title",
    "description",
    "price",
    "wholesalePrice",
    "regularPrice",
    "supplierName",
    "supplierContat",
    "returnPolicy"
  ];

  const cleaned = {};

  // Helper sanitizers
  const toStr = (v) => (v === undefined || v === null ? null : String(v).trim());
  const toNum = (v) => {
    const num = Number(v);
    return isNaN(num) ? null : num;
  };

  // Clean each allowed field
  allowed.forEach(field => {
    if (body[field] !== undefined && body[field] !== "") {
      if (["title", "description", "supplierName", "returnPolicy", "supplierContat"].includes(field)) {
        cleaned[field] = toStr(body[field]);
      } else if (["price", "wholesalePrice", "regularPrice"].includes(field)) {
        const num = toNum(body[field]);
        cleaned[field] = num < 0 ? 0 : num;
      }
    }
  });


  // Attach sanitized data to request
  req.cleanedData = cleaned;

  next();
};
