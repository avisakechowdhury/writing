import { sanitizeMongoInput, sanitizeHTML } from '../utils/validation.js';

/**
 * Middleware to sanitize request body to prevent MongoDB injection and XSS
 */
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeMongoInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeMongoInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeMongoInput(req.params);
  }
  next();
};

/**
 * Middleware to sanitize HTML content in specific fields
 */
export const sanitizeHTMLFields = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHTML(req.body[field]);
        }
      });
    }
    next();
  };
};

