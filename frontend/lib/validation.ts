/**
 * Form validation utilities
 */

export const validation = {
  // Validate email
  isValidEmail: (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // Validate password (min 8 chars)
  isValidPassword: (password: string): boolean => {
    return password.length >= 8;
  },

  // Validate name
  isValidName: (name: string): boolean => {
    return name.trim().length >= 1 && name.trim().length <= 255;
  },

  // Validate age (18-100)
  isValidAge: (age: number): boolean => {
    return age >= 18 && age <= 100;
  },

  // Validate psychographic value (0-1)
  isValidPsychographic: (value: number): boolean => {
    return value >= 0 && value <= 1;
  },

  // Clamp value to range
  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  },
};
