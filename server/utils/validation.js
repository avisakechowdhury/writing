// Utility functions for validation

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
export const isValidObjectId = (id) => {
  return id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Validates if a string is a valid email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if valid email, false otherwise
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email && typeof email === 'string' && emailRegex.test(email);
};

/**
 * Validates if a string is a valid username format
 * @param {string} username - The username to validate
 * @returns {boolean} - True if valid username, false otherwise
 */
export const isValidUsername = (username) => {
  // Username should be 3-20 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return username && typeof username === 'string' && usernameRegex.test(username);
};

/**
 * Sanitizes a string by removing HTML tags and trimming whitespace
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
};

/**
 * Sanitizes input to prevent MongoDB injection
 * @param {any} input - The input to sanitize
 * @returns {any} - The sanitized input
 */
export const sanitizeMongoInput = (input) => {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    return input.replace(/\$|\./g, '');
  }
  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      return input.map(item => sanitizeMongoInput(item));
    }
    const sanitized = {};
    for (const key in input) {
      // Remove keys that start with $ (MongoDB operators)
      if (!key.startsWith('$')) {
        sanitized[key] = sanitizeMongoInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};

/**
 * Sanitizes HTML content to prevent XSS
 * @param {string} html - The HTML string to sanitize
 * @returns {string} - The sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';
  // Basic XSS prevention - remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Validates if a string is a valid URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid URL, false otherwise
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
