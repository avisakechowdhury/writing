/**
 * Email Validation Utility
 * 
 * This utility provides email validation including:
 * - Basic format validation
 * - Disposable email detection (recommendation)
 * - Domain validation
 * 
 * RECOMMENDATION: To prevent fake/random email registrations, consider:
 * 1. Using a service like:
 *    - EmailListVerify API (https://www.emaillistverify.com/)
 *    - ZeroBounce API (https://www.zerobounce.net/)
 *    - Abstract API Email Validation (https://www.abstractapi.com/email-validation-api)
 * 
 * 2. Or implement disposable email domain blocking using a list like:
 *    - https://github.com/disposable/disposable-email-domains
 * 
 * 3. For production, you can add MX record checking to verify the domain exists
 */

// Common disposable email domains (sample list - expand as needed)
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'tempmail.com',
  'guerrillamail.com',
  'mailinator.com',
  'throwaway.email',
  'temp-mail.org',
  'getnada.com',
  'mohmal.com',
  'fakeinbox.com',
  'trashmail.com',
  'yopmail.com',
  'sharklasers.com',
  'grr.la',
  'guerrillamailblock.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chitthi.in',
  'dispostable.com',
  'meltmail.com',
  'emailondeck.com',
  'getairmail.com',
  'mintemail.com',
  'mytrashmail.com',
  'tempail.com',
  'tempinbox.co.uk',
  'tempmailo.com',
  'tmpmail.net',
  'tmpmail.org',
  '33mail.com',
  'maildrop.cc',
  'mailsac.com',
  'mailtemp.info',
  'mintemail.com',
  'mohmal.com',
  'mytrashmail.com',
  'sharklasers.com',
  'spamgourmet.com',
  'throwaway.email',
  'tmpmail.net',
  'yopmail.com'
];

/**
 * Check if email domain is disposable
 * @param {string} email - Email address to check
 * @returns {boolean} - True if disposable, false otherwise
 */
export const isDisposableEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid format, false otherwise
 */
export const isValidEmailFormat = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Check if email domain looks suspicious (random characters)
 * @param {string} email - Email address to check
 * @returns {boolean} - True if suspicious, false otherwise
 */
export const hasSuspiciousDomain = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  
  // Check for patterns that suggest random/fake domains
  // - Very long domains (>50 chars)
  // - Many numbers mixed randomly
  // - No vowels (suspicious)
  // - Repeated characters (aaa, 111, etc.)
  
  if (domain.length > 50) return true;
  
  // Check for excessive numbers (more than 50% numbers is suspicious)
  const numbers = (domain.match(/\d/g) || []).length;
  if (numbers > domain.length * 0.5) return true;
  
  // Check for lack of vowels (suspicious for random strings)
  const vowels = (domain.match(/[aeiou]/g) || []).length;
  if (vowels === 0 && domain.length > 10) return true;
  
  // Check for repeated patterns (aaa, 111, etc.)
  if (/(.)\1{4,}/.test(domain)) return true;
  
  return false;
};

/**
 * Comprehensive email validation
 * @param {string} email - Email address to validate
 * @returns {{valid: boolean, reason?: string}} - Validation result
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required' };
  }
  
  if (!isValidEmailFormat(email)) {
    return { valid: false, reason: 'Invalid email format' };
  }
  
  if (isDisposableEmail(email)) {
    return { valid: false, reason: 'Disposable email addresses are not allowed' };
  }
  
  if (hasSuspiciousDomain(email)) {
    return { valid: false, reason: 'Email domain appears to be invalid' };
  }
  
  return { valid: true };
};

/**
 * RECOMMENDATION: For production, implement real-time email validation using:
 * 
 * Example with Abstract API:
 * ```javascript
 * import axios from 'axios';
 * 
 * export const validateEmailWithAPI = async (email) => {
 *   try {
 *     const response = await axios.get('https://emailvalidation.abstractapi.com/v1/', {
 *       params: {
 *         api_key: process.env.ABSTRACT_API_KEY,
 *         email: email
 *       }
 *     });
 *     
 *     return {
 *       valid: response.data.deliverability === 'DELIVERABLE',
 *       reason: response.data.deliverability === 'DELIVERABLE' ? undefined : 'Email is not deliverable'
 *     };
 *   } catch (error) {
 *     console.error('Email validation API error:', error);
 *     // Fallback to basic validation
 *     return validateEmail(email);
 *   }
 * };
 * ```
 * 
 * Example with ZeroBounce:
 * ```javascript
 * export const validateEmailWithZeroBounce = async (email) => {
 *   try {
 *     const response = await axios.get('https://api.zerobounce.net/v2/validate', {
 *       params: {
 *         api_key: process.env.ZEROBOUNCE_API_KEY,
 *         email: email
 *       }
 *     });
 *     
 *     return {
 *       valid: response.data.status === 'valid',
 *       reason: response.data.status !== 'valid' ? 'Email is not valid' : undefined
 *     };
 *   } catch (error) {
 *     console.error('Email validation API error:', error);
 *     return validateEmail(email);
 *   }
 * };
 * ```
 */

