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
