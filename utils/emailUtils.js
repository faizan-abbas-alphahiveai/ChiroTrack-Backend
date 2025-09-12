/**
 * Email utility functions for consistent email handling
 */

/**
 * Normalizes an email address for consistent storage and comparison
 * This function handles Gmail-specific normalization (removing dots from local part)
 * and converts to lowercase
 * 
 * @param {string} email - The email address to normalize
 * @returns {string} - The normalized email address
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return email;
  }

  // Convert to lowercase and trim whitespace
  let normalized = email.toLowerCase().trim();
  
  // Extract domain and local part
  const [localPart, domain] = normalized.split('@');
  
  if (!localPart || !domain) {
    return normalized;
  }
  
  // For Gmail addresses, remove dots from the local part
  // Gmail treats saad.aslam49@gmail.com and saadaslam49@gmail.com as the same
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalizedLocalPart = localPart.replace(/\./g, '');
    return `${normalizedLocalPart}@${domain}`;
  }
  
  return normalized;
};

/**
 * Checks if two email addresses are equivalent after normalization
 * 
 * @param {string} email1 - First email address
 * @param {string} email2 - Second email address
 * @returns {boolean} - True if emails are equivalent
 */
export const areEmailsEquivalent = (email1, email2) => {
  return normalizeEmail(email1) === normalizeEmail(email2);
};

/**
 * Validates if an email address is in a valid format
 * 
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email format is valid
 */
export const isValidEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
