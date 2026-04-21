const stripDangerousKeys = (value) => {
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }

  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }

  return Object.entries(value).reduce((sanitized, [key, nestedValue]) => {
    if (key.startsWith('$') || key.includes('.')) {
      return sanitized;
    }

    sanitized[key] = stripDangerousKeys(nestedValue);
    return sanitized;
  }, {});
};

const sanitizeScalar = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value.replace(/\u0000/g, '').trim();
};

const deepSanitize = (value) => {
  if (Array.isArray(value)) {
    return value.map(deepSanitize);
  }

  if (!value || typeof value !== 'object' || value instanceof Date || Buffer.isBuffer(value)) {
    return sanitizeScalar(value);
  }

  return Object.entries(value).reduce((sanitized, [key, nestedValue]) => {
    sanitized[key] = deepSanitize(nestedValue);
    return sanitized;
  }, {});
};

export const sanitizeRequestInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = deepSanitize(stripDangerousKeys(req.body));
  }

  if (req.query && typeof req.query === 'object') {
    req.query = deepSanitize(stripDangerousKeys(req.query));
  }

  next();
};