/**
 * Utility function to create an HTTP response
 */
export const response = (statusCode: number, message: string | object) => ({
  statusCode,
  body: JSON.stringify(typeof message === "string" ? { message } : message),
});
