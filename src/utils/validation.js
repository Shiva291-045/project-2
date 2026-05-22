/**
 * Validation Utilities
 * Comprehensive form and input validation with real-time feedback
 */

/**
 * Email validation
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = re.test(email.trim());
  
  return {
    isValid,
    error: !isValid ? "Invalid email address" : null,
  };
};

/**
 * Password validation with detailed feedback
 */
export const validatePassword = (password) => {
  const errors = [];
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  if (!checks.length) errors.push("At least 8 characters");
  if (!checks.uppercase) errors.push("Uppercase letter (A-Z)");
  if (!checks.lowercase) errors.push("Lowercase letter (a-z)");
  if (!checks.number) errors.push("Number (0-9)");
  if (!checks.special) errors.push("Special character (!@#$%^&*)");

  const strength =
    Object.values(checks).filter(Boolean).length;

  return {
    isValid: errors.length === 0,
    errors,
    strength, // 0-5
    strengthLabel: getStrengthLabel(strength),
    checks,
  };
};

/**
 * Get password strength label
 */
function getStrengthLabel(strength) {
  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  return labels[strength] || "Very Weak";
}

/**
 * Name validation
 */
export const validateName = (name) => {
  const trimmed = name.trim();
  const errors = [];

  if (trimmed.length < 2) {
    errors.push("At least 2 characters");
  }
  if (trimmed.length > 50) {
    errors.push("Maximum 50 characters");
  }
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    errors.push("Only letters, spaces, hyphens, and apostrophes allowed");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Form validation
 */
export const validateForm = (data, rules) => {
  const errors = {};

  for (const field in rules) {
    const value = data[field] || "";
    const fieldRules = rules[field];

    if (fieldRules.required && !value.trim()) {
      errors[field] = `${fieldRules.label} is required`;
      continue;
    }

    if (value && fieldRules.validate) {
      const validation = fieldRules.validate(value);
      if (!validation.isValid) {
        errors[field] = validation.errors?.[0] || validation.error;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Real-time field validation
 */
export const validateField = (fieldName, value, rules) => {
  const fieldRule = rules[fieldName];

  if (!fieldRule) {
    return { isValid: true, error: null };
  }

  if (fieldRule.required && !value.trim()) {
    return {
      isValid: false,
      error: `${fieldRule.label} is required`,
    };
  }

  if (value && fieldRule.validate) {
    const validation = fieldRule.validate(value);
    return {
      isValid: validation.isValid,
      error: validation.errors?.[0] || validation.error || null,
      ...validation, // Include extra info like password strength
    };
  }

  return { isValid: true, error: null };
};

/**
 * Debounced validation
 */
export const createDebouncedValidator = (validator, delay = 300) => {
  let timeoutId;

  return (value, callback) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const result = validator(value);
      callback(result);
    }, delay);
  };
};

/**
 * Password strength meter
 */
export const getPasswordStrengthColor = (strength) => {
  const colors = [
    "bg-red-500",     // 0
    "bg-orange-500",  // 1
    "bg-yellow-500",  // 2
    "bg-lime-500",    // 3
    "bg-green-500",   // 4
    "bg-emerald-600", // 5
  ];
  return colors[strength] || colors[0];
};

/**
 * Password strength percentage
 */
export const getPasswordStrengthPercent = (strength) => {
  return Math.round((strength / 5) * 100);
};

/**
 * Check if passwords match
 */
export const passwordsMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Trim whitespace from form values
 */
export const trimFormValues = (values) => {
  const trimmed = {};
  for (const key in values) {
    trimmed[key] = typeof values[key] === "string"
      ? values[key].trim()
      : values[key];
  }
  return trimmed;
};

/**
 * Standard validation rules for forms
 */
export const FORM_RULES = {
  email: {
    label: "Email",
    required: true,
    validate: validateEmail,
  },
  password: {
    label: "Password",
    required: true,
    validate: validatePassword,
  },
  confirmPassword: {
    label: "Confirm Password",
    required: true,
  },
  displayName: {
    label: "Full Name",
    required: true,
    validate: validateName,
  },
  firstName: {
    label: "First Name",
    required: true,
    validate: validateName,
  },
  lastName: {
    label: "Last Name",
    required: true,
    validate: validateName,
  },
};
