function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePositiveQuantity(value) {
  const quantity = value === undefined ? 1 : Number(value);
  return Number.isInteger(quantity) && quantity > 0 ? quantity : null;
}

function parseOptionalText(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

module.exports = {
  parsePositiveInt,
  parsePositiveQuantity,
  parseOptionalText,
  isValidEmail,
  normalizeEmail,
};
