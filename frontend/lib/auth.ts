/**
 * Authentication utilities
 */

export const auth = {
  // Store token
  setToken: (token: string, userId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_id', userId);
    }
  },

  // Get token
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  // Get user ID
  getUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('user_id');
  },

  // Clear auth
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('access_token');
  },
};
