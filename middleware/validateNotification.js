import { body } from "express-validator";

// Validation rules for the notification request
export const validateNotification = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('type').trim().isLength({ min: 1 }).withMessage('Type is required'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('sendToAll').optional().isBoolean().withMessage('sendToAll must be boolean'),
  body('receiverId').custom((value, { req }) => {
    if (!req.body.sendToAll && !value) {
      throw new Error('Receiver ID is required when not sending to all');
    }
    return true;
  })
];
