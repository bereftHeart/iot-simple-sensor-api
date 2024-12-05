const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidDate = (date: string) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

  const [year, month, day] = date.split("-").map(Number);
  // Create a new Date object with the same year, month, and day
  const parsedDate = new Date(year, month - 1, day);
  // Compare it to the original date string
  const valid =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;

  return dateRegex.test(date) && !isNaN(parsedDate.getTime()) && valid;
};

export { isValidEmail, isValidDate };
