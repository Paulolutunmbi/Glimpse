export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  if (!error) return fallback;

  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.details) return data.details;

  return error.message || fallback;
};

export const getUsernameConflictMessage = (error, fallback = 'This username is already taken.') => {
  const data = error?.response?.data || {};
  const message = `${data.message || data.error || data.details || error?.message || ''}`.toLowerCase();

  if (error?.response?.status === 409) {
    return 'This username is already taken. Try another one.';
  }

  if (message.includes('username') && (message.includes('taken') || message.includes('exists') || message.includes('already'))) {
    return 'This username is already taken. Try another one.';
  }

  return fallback;
};
