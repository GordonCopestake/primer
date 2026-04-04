export const createStableError = (code, message) => ({
  error: {
    code,
    message,
  },
});
