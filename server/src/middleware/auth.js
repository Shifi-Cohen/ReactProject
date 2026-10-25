const prisma = require("../lib/prisma");
const { verifyToken, toPublicUser } = require("../lib/auth");
const { parsePositiveInt } = require("../lib/parsers");

function readBearerToken(req) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function attachUser(req, res, next) {
  try {
    req.user = null;

    const token = readBearerToken(req);
    if (!token) {
      return next();
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch (error) {
      return next();
    }

    const userId = parsePositiveInt(payload.userId);
    if (!userId) {
      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    req.user = toPublicUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "נדרשת הזדהות. שלחי כותרת Authorization: Bearer <token>.",
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "נדרשת הזדהות. שלחי כותרת Authorization: Bearer <token>.",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "פעולה זו זמינה למנהל בלבד." });
  }

  next();
}

module.exports = {
  attachUser,
  requireAuth,
  requireAdmin,
};
