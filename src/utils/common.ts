export const excludeSensitiveFields = <T>(
  item: T,
  sensitiveFields: (keyof T)[]
): Partial<T> => {
  const clone = { ...item };
  for (const field of sensitiveFields) {
    delete clone[field];
  }
  return clone;
};
