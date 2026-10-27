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

function localIsraeliPhone(phone) {
  if (typeof phone !== "string") {
    return "";
  }

  let text = phone.trim().replace(/[\s().-]/g, "");
  if (text.startsWith("+")) {
    text = text.slice(1);
  }
  if (text.startsWith("00")) {
    text = text.slice(2);
  }
  if (text.startsWith("972")) {
    text = `0${text.slice(3)}`;
  }

  return text;
}

function isValidIsraeliPhone(phone) {
  return /^0(?:[23489]\d{7}|5\d{8}|7[2-9]\d{7})$/.test(localIsraeliPhone(phone));
}

module.exports = {
  parsePositiveInt,
  parsePositiveQuantity,
  parseOptionalText,
  isValidEmail,
  normalizeEmail,
  isValidIsraeliPhone,
};
