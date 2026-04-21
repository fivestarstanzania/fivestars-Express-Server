import { body, param, query, validationResult } from 'express-validator';

const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const allowedOrderStatuses = ['Pending', 'Received', 'Confirmed', 'Delivered', 'Cancelled'];
const allowedClickSources = ['search', 'home', 'category', 'offer', 'sellerProfile', 'popular', 'latest', 'other'];
const allowedNotificationTargets = ['all', 'customer', 'seller'];

const cleanText = (value) => (typeof value === 'string' ? value.replace(/\u0000/g, '').trim() : value);

const textField = (field, label, { required = false, min = 1, max = 255 } = {}) => {
  let chain = body(field);

  if (required) {
    chain = chain.exists({ checkFalsy: true }).withMessage(`${label} is required`);
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain
    .isString().withMessage(`${label} must be a string`)
    .bail()
    .customSanitizer(cleanText)
    .isLength({ min, max }).withMessage(`${label} must be between ${min} and ${max} characters`);
};

const objectIdBodyField = (field, label, required = true) => {
  let chain = body(field);

  if (required) {
    chain = chain.exists({ checkFalsy: true }).withMessage(`${label} is required`);
  } else {
    chain = chain.optional({ values: 'falsy' });
  }

  return chain.matches(objectIdPattern).withMessage(`${label} must be a valid ID`);
};

export const handleValidationResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  next();
};

export const validateObjectIdParam = (name, label = name) => [
  param(name)
    .matches(objectIdPattern)
    .withMessage(`${label} must be a valid ID`),
  handleValidationResults,
];

export const validateGoogleLoginRequest = [
  body('token')
    .exists({ checkFalsy: true }).withMessage('Google token is required')
    .bail()
    .isString().withMessage('Google token must be a string')
    .bail()
    .customSanitizer(cleanText)
    .isLength({ min: 20, max: 4096 }).withMessage('Google token is invalid'),
  handleValidationResults,
];

export const validateAppleLoginRequest = [
  body('identityToken')
    .exists({ checkFalsy: true }).withMessage('identityToken is required')
    .bail()
    .isString().withMessage('identityToken must be a string')
    .bail()
    .customSanitizer(cleanText),
  body('nonce')
    .exists({ checkFalsy: true }).withMessage('nonce is required')
    .bail()
    .isString().withMessage('nonce must be a string')
    .bail()
    .customSanitizer(cleanText)
    .isLength({ min: 8, max: 255 }).withMessage('nonce is invalid'),
  body('userData').optional().isObject().withMessage('userData must be an object'),
  handleValidationResults,
];

export const validateRefreshTokenRequest = [
  body('refreshToken')
    .exists({ checkFalsy: true }).withMessage('Refresh token is required')
    .bail()
    .isString().withMessage('Refresh token must be a string')
    .bail()
    .customSanitizer(cleanText)
    .isLength({ min: 20, max: 4096 }).withMessage('Refresh token is invalid'),
  handleValidationResults,
];

export const validateExpoPushTokenUpdate = [
  textField('expoPushToken', 'Expo push token', { required: true, min: 8, max: 255 }),
  handleValidationResults,
];

export const validateVisitPayload = [
  textField('deviceId', 'deviceId', { required: true, min: 3, max: 255 }),
  body('userId').optional({ values: 'falsy' }).matches(objectIdPattern).withMessage('userId must be a valid ID'),
  handleValidationResults,
];

export const validateProductCreateRequest = [
  textField('title', 'Title', { required: true, min: 2, max: 150 }),
  textField('description', 'Description', { required: true, min: 5, max: 5000 }),
  textField('category', 'Category', { required: true, min: 2, max: 100 }),
  textField('subcategory', 'Subcategory', { required: false, min: 2, max: 100 }),
  textField('supplierName', 'Supplier name', { required: false, min: 2, max: 150 }),
  textField('supplierContat', 'Supplier contact', { required: false, min: 5, max: 100 }),
  textField('returnPolicy', 'Return policy', { required: false, min: 2, max: 1000 }),
  body('price').exists({ checkFalsy: true }).withMessage('Price is required').bail().isFloat({ gt: 0 }).withMessage('Price must be greater than 0').toFloat(),
  body('regularPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Regular price must be a valid number').toFloat(),
  body('wholesalePrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Wholesale price must be a valid number').toFloat(),
  body('specifications').optional({ values: 'falsy' }).custom((value) => {
    if (typeof value === 'string') {
      JSON.parse(value);
      return true;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Specifications must be an object or valid JSON string');
    }

    return true;
  }),
  handleValidationResults,
];

export const validateProductUpdateRequest = [
  param('productId').matches(objectIdPattern).withMessage('productId must be a valid ID'),
  textField('title', 'Title', { required: false, min: 2, max: 150 }),
  textField('description', 'Description', { required: false, min: 5, max: 5000 }),
  textField('supplierName', 'Supplier name', { required: false, min: 2, max: 150 }),
  textField('supplierContat', 'Supplier contact', { required: false, min: 5, max: 100 }),
  textField('returnPolicy', 'Return policy', { required: false, min: 2, max: 1000 }),
  body('price').optional({ values: 'falsy' }).isFloat({ gt: 0 }).withMessage('Price must be greater than 0').toFloat(),
  body('regularPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Regular price must be a valid number').toFloat(),
  body('wholesalePrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Wholesale price must be a valid number').toFloat(),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean').toBoolean(),
  handleValidationResults,
];

export const validateEditProductRequest = [
  objectIdBodyField('productId', 'productId'),
  textField('name', 'Name', { required: true, min: 2, max: 150 }),
  textField('description', 'Description', { required: true, min: 5, max: 5000 }),
  body('price').exists({ checkFalsy: true }).withMessage('Price is required').bail().isFloat({ gt: 0 }).withMessage('Price must be greater than 0').toFloat(),
  handleValidationResults,
];

export const validateProductClickRequest = [
  objectIdBodyField('productId', 'productId'),
  textField('productTitle', 'productTitle', { required: true, min: 1, max: 255 }),
  body('userId').optional({ values: 'falsy' }).matches(objectIdPattern).withMessage('userId must be a valid ID'),
  body('source').optional({ values: 'falsy' }).isIn(allowedClickSources).withMessage('source is invalid'),
  handleValidationResults,
];

export const validateProductBatchRequest = [
  body('ids').isArray({ min: 1, max: 100 }).withMessage('ids must be a non-empty array'),
  body('ids.*').matches(objectIdPattern).withMessage('Each id must be valid'),
  handleValidationResults,
];

export const validateCreateOrderRequest = [
  objectIdBodyField('sellerUserId', 'sellerUserId'),
  objectIdBodyField('productId', 'productId'),
  body('buyer').isObject().withMessage('buyer is required'),
  body('buyer.name').exists({ checkFalsy: true }).withMessage('Buyer name is required').bail().isString().withMessage('Buyer name must be a string').bail().customSanitizer(cleanText).isLength({ min: 2, max: 120 }).withMessage('Buyer name is invalid'),
  body('buyer.contact').exists({ checkFalsy: true }).withMessage('Buyer contact is required').bail().isString().withMessage('Buyer contact must be a string').bail().customSanitizer(cleanText).isLength({ min: 5, max: 60 }).withMessage('Buyer contact is invalid'),
  body('buyer.address').exists({ checkFalsy: true }).withMessage('Buyer address is required').bail().isString().withMessage('Buyer address must be a string').bail().customSanitizer(cleanText).isLength({ min: 5, max: 500 }).withMessage('Buyer address is invalid'),
  body('quantity').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }).withMessage('quantity must be between 1 and 100').toInt(),
  textField('size', 'size', { required: false, min: 1, max: 50 }),
  body('totalPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('totalPrice must be a valid number').toFloat(),
  body('selectedImageUrl').optional({ values: 'falsy' }).isString().withMessage('selectedImageUrl must be a string').bail().customSanitizer(cleanText).isLength({ max: 2048 }).withMessage('selectedImageUrl is too long'),
  handleValidationResults,
];

export const validateOrderStatusUpdateRequest = [
  param('orderId').matches(objectIdPattern).withMessage('orderId must be a valid ID'),
  body('status').exists({ checkFalsy: true }).withMessage('status is required').bail().isIn(allowedOrderStatuses).withMessage('status is invalid'),
  handleValidationResults,
];

export const validateOrderDetailsQuery = [
  query('orderId').matches(objectIdPattern).withMessage('orderId must be a valid ID'),
  handleValidationResults,
];

export const validateCreateReviewRequest = [
  body('reviewType').exists({ checkFalsy: true }).withMessage('reviewType is required').bail().isIn(['Product', 'Seller']).withMessage('reviewType must be Product or Seller'),
  body('productId').custom((value, { req }) => {
    if (req.body.reviewType === 'Product' && !objectIdPattern.test(String(value || ''))) {
      throw new Error('productId is required for product reviews');
    }
    return true;
  }),
  body('sellerUserId').custom((value, { req }) => {
    if (req.body.reviewType === 'Seller' && !objectIdPattern.test(String(value || ''))) {
      throw new Error('sellerUserId is required for seller reviews');
    }
    return true;
  }),
  objectIdBodyField('userId', 'userId'),
  body('rating').exists({ checkFalsy: true }).withMessage('rating is required').bail().isInt({ min: 1, max: 5 }).withMessage('rating must be between 1 and 5').toInt(),
  textField('reviewText', 'reviewText', { required: true, min: 2, max: 2000 }),
  handleValidationResults,
];

export const validateReviewLookupRequest = [
  param('reviewType').isIn(['Product', 'Seller']).withMessage('reviewType must be Product or Seller'),
  param('id').matches(objectIdPattern).withMessage('id must be a valid ID'),
  handleValidationResults,
];

export const validateAgreeTermsRequest = [
  objectIdBodyField('userId', 'userId'),
  handleValidationResults,
];

export const validateSellerApplicationRequest = [
  textField('phone', 'phone', { required: true, min: 5, max: 40 }),
  textField('description', 'description', { required: true, min: 10, max: 3000 }),
  textField('businessName', 'businessName', { required: true, min: 2, max: 150 }),
  body('businessAddress').isObject().withMessage('businessAddress is required'),
  body('businessAddress.street').exists({ checkFalsy: true }).withMessage('businessAddress.street is required').bail().isString().withMessage('businessAddress.street must be a string').bail().customSanitizer(cleanText).isLength({ min: 2, max: 255 }).withMessage('businessAddress.street is invalid'),
  body('businessAddress.region').exists({ checkFalsy: true }).withMessage('businessAddress.region is required').bail().isString().withMessage('businessAddress.region must be a string').bail().customSanitizer(cleanText).isLength({ min: 2, max: 120 }).withMessage('businessAddress.region is invalid'),
  body('profileImage').exists({ checkFalsy: true }).withMessage('profileImage is required').bail().isString().withMessage('profileImage must be a string').bail().customSanitizer(cleanText).isLength({ max: 5000000 }).withMessage('profileImage is too large'),
  handleValidationResults,
];

export const validateFeedbackRequest = [
  textField('feedback', 'feedback', { required: true, min: 2, max: 2000 }),
  handleValidationResults,
];

export const validateNotificationSendRequest = [
  textField('title', 'title', { required: true, min: 1, max: 150 }),
  textField('message', 'message', { required: true, min: 1, max: 2000 }),
  textField('type', 'type', { required: true, min: 1, max: 100 }),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('metadata must be an object'),
  body('sendToAll').optional().isBoolean().withMessage('sendToAll must be boolean').toBoolean(),
  body('receiverId').custom((value, { req }) => {
    if (!req.body.sendToAll && !objectIdPattern.test(String(value || ''))) {
      throw new Error('receiverId is required when not sending to all');
    }
    return true;
  }),
  handleValidationResults,
];

export const validateMarkNotificationReadRequest = [
  param('id').matches(objectIdPattern).withMessage('id must be a valid ID'),
  handleValidationResults,
];

export const validateUserProductRelationRequest = [
  objectIdBodyField('userId', 'userId'),
  objectIdBodyField('productId', 'productId'),
  handleValidationResults,
];

export const validateAdminNotificationSendRequest = [
  param('id').matches(objectIdPattern).withMessage('id must be a valid ID'),
  textField('title', 'title', { required: true, min: 1, max: 150 }),
  textField('message', 'message', { required: true, min: 1, max: 2000 }),
  textField('type', 'type', { required: false, min: 1, max: 100 }),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('metadata must be an object'),
  handleValidationResults,
];

export const validateAdminBroadcastRequest = [
  textField('title', 'title', { required: true, min: 1, max: 150 }),
  textField('message', 'message', { required: true, min: 1, max: 2000 }),
  textField('type', 'type', { required: false, min: 1, max: 100 }),
  body('toward').exists({ checkFalsy: true }).withMessage('toward is required').bail().isIn(allowedNotificationTargets).withMessage('toward is invalid'),
  handleValidationResults,
];

export const validateAdminNotificationUpdateRequest = [
  param('id').matches(objectIdPattern).withMessage('id must be a valid ID'),
  textField('title', 'title', { required: true, min: 1, max: 150 }),
  textField('message', 'message', { required: true, min: 1, max: 2000 }),
  textField('type', 'type', { required: false, min: 1, max: 100 }),
  body('metadata').optional({ values: 'falsy' }).isObject().withMessage('metadata must be an object'),
  handleValidationResults,
];

export const validateAdminNotificationReadRequest = [
  param('id').matches(objectIdPattern).withMessage('id must be a valid ID'),
  body('isRead').isBoolean().withMessage('isRead must be boolean').toBoolean(),
  handleValidationResults,
];