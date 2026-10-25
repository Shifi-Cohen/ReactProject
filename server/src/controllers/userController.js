const prisma = require("../lib/prisma");
const { hashPassword, toPublicUser } = require("../lib/auth");
const { isValidEmail, normalizeEmail, parsePositiveInt, parseOptionalText } = require("../lib/parsers");

async function updateUser(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה משתמש לא תקין." });
    }

    const isSelf = req.user && req.user.id === id;
    const isAdmin = req.user && req.user.role === "ADMIN";
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "אין הרשאה לעדכן משתמש זה." });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "המשתמש לא נמצא." });
    }

    const data = {};
    if (typeof req.body.fullName === "string") {
      const fullName = req.body.fullName.trim();
      if (!fullName) {
        return res.status(400).json({ message: "שם מלא לא יכול להיות ריק." });
      }
      data.fullName = fullName;
    }
    if (req.body.phone !== undefined) {
      data.phone = parseOptionalText(req.body.phone) ?? null;
    }
    if (typeof req.body.email === "string") {
      const email = normalizeEmail(req.body.email);
      if (!isValidEmail(email)) {
        return res.status(400).json({ message: "יש לספק כתובת מייל תקינה." });
      }
      data.email = email;
    }
    if (req.body.password !== undefined) {
      if (typeof req.body.password !== "string" || req.body.password.length < 6) {
        return res.status(400).json({ message: "סיסמה חייבת להכיל לפחות 6 תווים." });
      }
      data.password = await hashPassword(req.body.password);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "לא נשלחו שדות לעדכון." });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "כתובת המייל כבר בשימוש." });
    }
    next(error);
  }
}

module.exports = {
  updateUser,
};
