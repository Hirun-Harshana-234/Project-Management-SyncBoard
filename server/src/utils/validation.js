const AppError = require("./AppError");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_.@-]{3,40}$/;

function requiredString(value, name, maxLength) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new AppError(422, `${name} is required.`);
  if (maxLength && result.length > maxLength) throw new AppError(422, `${name} must be ${maxLength} characters or fewer.`);
  return result;
}

function validateRegistration(body) {
  const displayName = requiredString(body.displayName, "Display name", 80);
  const username = requiredString(body.username, "Username", 40).toLowerCase();
  const email = requiredString(body.email, "Email", 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!usernamePattern.test(username)) throw new AppError(422, "Username must be 3-40 characters using letters, numbers, @, dot, underscore, or hyphen.");
  if (!emailPattern.test(email)) throw new AppError(422, "Enter a valid email address.");
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new AppError(422, "Password must be at least 8 characters and contain a letter and number.");
  }
  return { displayName, username, email, password };
}

function pick(object, allowedFields) {
  return allowedFields.reduce((result, field) => {
    if (Object.prototype.hasOwnProperty.call(object, field)) result[field] = object[field];
    return result;
  }, {});
}

module.exports = { emailPattern, requiredString, validateRegistration, pick };
