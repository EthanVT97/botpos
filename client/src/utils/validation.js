/**
 * Validation utilities for form inputs
 */

export const validateEmail = (email) => {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  // Myanmar phone numbers typically start with 09 and have 9-11 digits
  const phoneRegex = /^(09|\+?959)\d{7,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const validatePositiveNumber = (value) => {
  return validateNumber(value, 0);
};

export const validatePrice = (value) => {
  return validateNumber(value, 0) && !isNaN(parseFloat(value));
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove potentially dangerous characters
  return input.trim().replace(/[<>]/g, '');
};

export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) return true;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file, allowedTypes = []) => {
  if (!file) return true;
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(file.type);
};

export const getValidationErrors = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    if (rule.required && !validateRequired(value)) {
      errors[field] = rule.message || `${field} is required`;
    }
    
    if (rule.email && value && !validateEmail(value)) {
      errors[field] = rule.message || 'Invalid email format';
    }
    
    if (rule.phone && value && !validatePhone(value)) {
      errors[field] = rule.message || 'Invalid phone number';
    }
    
    if (rule.number && value && !validateNumber(value, rule.min, rule.max)) {
      errors[field] = rule.message || 'Invalid number';
    }
    
    if (rule.positive && value && !validatePositiveNumber(value)) {
      errors[field] = rule.message || 'Must be a positive number';
    }
  });
  
  return errors;
};
