/**
 * Validation Utilities
 * Comprehensive validation functions for form inputs and data
 */

import { VALIDATION_RULES } from '@constants/app';

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }

  if (!VALIDATION_RULES.EMAIL.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }

  if (!VALIDATION_RULES.PHONE.test(phone)) {
    return { isValid: false, message: 'Please enter a valid phone number' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate name
 * @param {string} name - Name to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }

  if (!VALIDATION_RULES.NAME.test(name)) {
    return { isValid: false, message: 'Name must be 2-50 characters and contain only letters and spaces' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }

  if (!VALIDATION_RULES.PASSWORD.test(password)) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateUrl = (url) => {
  if (!url) {
    return { isValid: false, message: 'URL is required' };
  }

  if (!VALIDATION_RULES.URL.test(url)) {
    return { isValid: false, message: 'Please enter a valid URL' };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateRequired = (value, fieldName = 'Field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate minimum length
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length required
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateMinLength = (value, minLength, fieldName = 'Field') => {
  if (!value || value.length < minLength) {
    return { isValid: false, message: `${fieldName} must be at least ${minLength} characters` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate maximum length
 * @param {string} value - Value to validate
 * @param {number} maxLength - Maximum length allowed
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateMaxLength = (value, maxLength, fieldName = 'Field') => {
  if (value && value.length > maxLength) {
    return { isValid: false, message: `${fieldName} must be no more than ${maxLength} characters` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateNumberRange = (value, min, max, fieldName = 'Field') => {
  const numValue = Number(value);

  if (isNaN(numValue)) {
    return { isValid: false, message: `${fieldName} must be a valid number` };
  }

  if (numValue < min || numValue > max) {
    return { isValid: false, message: `${fieldName} must be between ${min} and ${max}` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return { isValid: false, message: `${fieldName} is required` };
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: `Please enter a valid ${fieldName.toLowerCase()}` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate future date
 * @param {string|Date} date - Date to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid and message
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
  const dateValidation = validateDate(date, fieldName);
  if (!dateValidation.isValid) {
    return dateValidation;
  }

  const dateObj = new Date(date);
  const now = new Date();

  if (dateObj <= now) {
    return { isValid: false, message: `${fieldName} must be in the future` };
  }

  return { isValid: true, message: '' };
};

/**
 * Validate form data object
 * @param {Object} formData - Form data to validate
 * @param {Object} validationRules - Validation rules for each field
 * @returns {Object} Validation result with isValid, errors, and isValid
 */
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  for (const [fieldName, rules] of Object.entries(validationRules)) {
    const value = formData[fieldName];

    for (const rule of rules) {
      const validation = rule.validator(value, rule.params, fieldName);

      if (!validation.isValid) {
        errors[fieldName] = validation.message;
        isValid = false;
        break; // Stop checking other rules for this field
      }
    }
  }

  return { isValid, errors };
};

/**
 * Create validation rule
 * @param {Function} validator - Validation function
 * @param {any} params - Parameters for the validator
 * @returns {Object} Validation rule object
 */
export const createValidationRule = (validator, params = null) => ({
  validator,
  params,
});

// Predefined validation rules
export const VALIDATION_RULES_PRESETS = {
  email: [createValidationRule(validateEmail)],
  phone: [createValidationRule(validatePhone)],
  name: [createValidationRule(validateName)],
  password: [createValidationRule(validatePassword)],
  url: [createValidationRule(validateUrl)],
  required: (fieldName) => [createValidationRule(validateRequired, fieldName)],
  minLength: (length, fieldName) => [createValidationRule(validateMinLength, { length, fieldName })],
  maxLength: (length, fieldName) => [createValidationRule(validateMaxLength, { length, fieldName })],
  numberRange: (min, max, fieldName) => [createValidationRule(validateNumberRange, { min, max, fieldName })],
  date: (fieldName) => [createValidationRule(validateDate, fieldName)],
  futureDate: (fieldName) => [createValidationRule(validateFutureDate, fieldName)],
};
