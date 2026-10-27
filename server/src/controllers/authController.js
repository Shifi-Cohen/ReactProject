const prisma = require("../lib/prisma");
const { parseOptionalText, isValidEmail, isValidIsraeliPhone, normalizeEmail } = require("../lib/parsers");
const { hashPassword, verifyPassword, signToken, toPublicUser } = require("../lib/auth");

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6) {
    return "סיסמה חייבת להכיל לפחות 6 תווים.";
  }
  return null;
}

async function signin(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const fullName = parseOptionalText(req.body.fullName);
    const phone = parseOptionalText(req.body.phone);
    const password = req.body.password;

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "יש לספק כתובת מייל תקינה." });
    }
    if (!fullName) {
      return res.status(400).json({ message: "שם מלא נדרש לצורך הרשמה." });
    }
    if (!phone) {
      return res.status(400).json({ message: "יש להזין טלפון." });
    }
    if (!isValidIsraeliPhone(phone)) {
      return res.status(400).json({ message: "יש להזין טלפון ישראלי תקין." });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "משתמש עם מייל זה כבר קיים." });
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        phone,
        password: hashedPassword,
      },
    });

    const token = signToken(user);
    return res.status(201).json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "משתמש עם מייל זה כבר קיים." });
    }
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!isValidEmail(email) || typeof password !== "string") {
      return res.status(400).json({ message: "יש לספק מייל וסיסמה." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "מייל או סיסמה שגויים." });
    }

    const matches = await verifyPassword(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: "מייל או סיסמה שגויים." });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: toPublicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  signin,
  login,
};
