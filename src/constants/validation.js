// ========================================
// 🎯 VALIDATION CONSTANTS
// ========================================

// Field Validation Rules
export const FIELD_VALIDATION = {
  REQUIRED: 'This field is required.',
  EMAIL: 'Please enter a valid email address.',
  PHONE: 'Please enter a valid phone number.',
  MIN_LENGTH: (min) => `Must be at least ${min} characters.`,
  MAX_LENGTH: (max) => `Must be no more than ${max} characters.`,
  PASSWORD_MATCH: 'Passwords must match.',
  INVALID_FORMAT: 'Invalid format.',
};

// Form Validation
export const FORM_VALIDATION = {
  SUBMIT_ERROR: 'Please fix the errors before submitting.',
  SUCCESS: 'Form submitted successfully.',
  LOADING: 'Submitting...',
};

// Task Validation
export const TASK_VALIDATION = {
  TITLE_REQUIRED: 'Task title is required.',
  TITLE_MIN_LENGTH: 'Task title must be at least 3 characters.',
  DESCRIPTION_MAX_LENGTH: 'Description must be no more than 500 characters.',
  DUE_DATE_REQUIRED: 'Due date is required.',
  DUE_DATE_FUTURE: 'Due date must be in the future.',
  ASSIGNEE_REQUIRED: 'Assignee is required.',
};

// Lead Validation
export const LEAD_VALIDATION = {
  NAME_REQUIRED: 'Lead name is required.',
  EMAIL_REQUIRED: 'Email is required.',
  PHONE_REQUIRED: 'Phone number is required.',
  COMPANY_REQUIRED: 'Company name is required.',
  STATUS_REQUIRED: 'Status is required.',
};
