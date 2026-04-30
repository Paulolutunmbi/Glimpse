export const getApiErrorMessage = (error, fallback = 'Something went wrong.') => {
  if (!error) return fallback;

  const data = error.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.details) return data.details;

  return error.message || fallback;
};
