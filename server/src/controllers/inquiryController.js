const prisma = require("../lib/prisma");
const {
  parsePositiveInt,
  parsePositiveQuantity,
  parseOptionalText,
  isValidEmail,
  isValidIsraeliPhone,
  normalizeEmail,
} = require("../lib/parsers");
const { getOrCreateCart } = require("./cartController");

const INQUIRY_STATUSES = ["NEW", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const SCRIPT_TYPES = ["ASHKENAZI", "SEPHARDI"];

function readScript(value) {
  if (SCRIPT_TYPES.includes(value)) {
    return value;
  }

  return null;
}

function summaryScript(scripts) {
  const unique = [...new Set(scripts)];
  if (unique.length === 1) {
    return unique[0];
  }

  return "MIXED";
}

function readInquiryContact({ contactEmail, contactPhone, message }) {
  const email = normalizeEmail(contactEmail);
  if (!isValidEmail(email)) {
    return { error: "יש לספק כתובת מייל תקינה." };
  }

  const phone = parseOptionalText(contactPhone);
  if (!phone) {
    return { error: "יש להזין טלפון." };
  }
  if (!isValidIsraeliPhone(phone)) {
    return { error: "יש להזין טלפון ישראלי תקין." };
  }

  return {
    email,
    phone,
    message: parseOptionalText(message) ?? null,
  };
}

async function savePhoneIfMissing(tx, userId, phone) {
  const user = await tx.user.findUnique({ where: { id: userId } });
  const currentPhone = user && user.phone ? user.phone.trim() : "";
  if (!currentPhone) {
    await tx.user.update({
      where: { id: userId },
      data: { phone },
    });
  }
}

const inquiryInclude = {
  user: {
    select: { id: true, email: true, fullName: true, phone: true, role: true },
  },
  items: {
    include: {
      product: {
        include: { category: true },
      },
    },
  },
};

async function createInquiry(req, res, next) {
  try {
    const contact = readInquiryContact({
      contactEmail: req.body.contactEmail,
      contactPhone: req.body.contactPhone,
      message: req.body.message,
    });
    if (contact.error) {
      return res.status(400).json({ message: contact.error });
    }

    const items = Array.isArray(req.body.items) ? req.body.items : null;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "יש לצרף לפחות מוצר אחד מהסל." });
    }

    const userId = req.user ? req.user.id : null;

    const normalizedItems = [];
    const productIds = [];

    for (const item of items) {
      const productId = parsePositiveInt(item.productId);
      const quantity = parsePositiveQuantity(item.quantity);
      const script = readScript(item.script);

      if (!productId) {
        return res.status(400).json({ message: "כל פריט חייב לכלול productId תקין." });
      }
      if (!quantity) {
        return res.status(400).json({ message: "כמות חייבת להיות מספר שלם חיובי." });
      }
      if (!script) {
        return res.status(400).json({ message: "יש לבחור כתב לכל קולמוס." });
      }

      normalizedItems.push({ productId, quantity, script });
      productIds.push(productId);
    }

    const uniqueIds = [...new Set(productIds)];
    const products = await prisma.product.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (products.length !== uniqueIds.length) {
      return res.status(400).json({ message: "אחד או יותר מהמוצרים בסל לא נמצאו." });
    }

    const unavailable = products.filter((product) => !product.isAvailable);
    if (unavailable.length > 0) {
      return res.status(400).json({
        message: "חלק מהמוצרים בסל אינם זמינים כרגע.",
        unavailableProductIds: unavailable.map((product) => product.id),
      });
    }

    const inquiry = await prisma.$transaction(async (tx) => {
      if (userId) {
        await savePhoneIfMissing(tx, userId, contact.phone);
      }

      return tx.inquiry.create({
        data: {
          userId,
          script: summaryScript(normalizedItems.map((item) => item.script)),
          contactEmail: contact.email,
          contactPhone: contact.phone,
          message: contact.message,
          items: {
            create: normalizedItems,
          },
        },
        include: inquiryInclude,
      });
    });

    return res.status(201).json({ inquiry });
  } catch (error) {
    next(error);
  }
}

async function getMyInquiries(req, res, next) {
  try {
    const userId = parsePositiveInt(req.params.userId);
    if (!userId) {
      return res.status(400).json({ message: "מזהה משתמש לא תקין." });
    }

    const isSelf = req.user.id === userId;
    const isAdmin = req.user.role === "ADMIN";
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "אין הרשאה לצפות בפניות של משתמש אחר." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "המשתמש לא נמצא." });
    }

    const inquiries = await prisma.inquiry.findMany({
      where: { userId },
      include: inquiryInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ inquiries });
  } catch (error) {
    next(error);
  }
}

async function getAllInquiries(req, res, next) {
  try {
    const where = {};
    if (typeof req.query.status === "string" && INQUIRY_STATUSES.includes(req.query.status)) {
      where.status = req.query.status;
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      include: inquiryInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ inquiries });
  } catch (error) {
    next(error);
  }
}

async function updateInquiryStatus(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה פנייה לא תקין." });
    }

    const status = req.body.status;
    if (!INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "סטטוס לא תקין.",
        allowed: INQUIRY_STATUSES,
      });
    }

    const existing = await prisma.inquiry.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "הפנייה לא נמצאה." });
    }

    const inquiry = await prisma.inquiry.update({
      where: { id },
      data: { status },
      include: inquiryInclude,
    });

    return res.json({ inquiry });
  } catch (error) {
    next(error);
  }
}

async function createInquiryFromCart(req, res, next) {
  try {
    const { contactEmail, contactPhone } = req.body;
    const contact = readInquiryContact({
      contactEmail,
      contactPhone,
      message: req.body.message,
    });
    if (contact.error) {
      return res.status(400).json({ message: contact.error });
    }

    const lines = Array.isArray(req.body.items) ? req.body.items : null;
    if (!lines || lines.length === 0) {
      return res.status(400).json({ message: "יש לסמן לפחות פריט אחד מהסל." });
    }

    const cart = await getOrCreateCart(req.user.id);

    if (!cart.items.length) {
      return res.status(400).json({ message: "הסל ריק. לא ניתן ליצור פנייה." });
    }

    const requested = [];
    for (const line of lines) {
      if (typeof line !== "object" || line === null) {
        return res.status(400).json({ message: "יש לבחור כתב לכל קולמוס." });
      }
      const id = parsePositiveInt(line.id);
      const script = readScript(line.script);
      if (!id || !script) {
        return res.status(400).json({ message: "יש לבחור כתב לכל קולמוס." });
      }
      requested.push({ id, script });
    }

    const selectedItems = [];
    for (const line of requested) {
      const item = cart.items.find((entry) => entry.id === line.id);
      if (!item) {
        return res.status(400).json({ message: "הפריטים שסומנו לא נמצאים בסל." });
      }
      selectedItems.push({ ...item, script: line.script });
    }

    const unavailable = selectedItems.filter((item) => !item.product.isAvailable);
    if (unavailable.length > 0) {
      return res.status(400).json({
        message: "חלק מהמוצרים בסל אינם זמינים כרגע.",
        unavailableProductIds: unavailable.map((item) => item.productId),
      });
    }

    const selectedIds = selectedItems.map((item) => item.id);

    const inquiry = await prisma.$transaction(async (tx) => {
      await savePhoneIfMissing(tx, req.user.id, contact.phone);

      const created = await tx.inquiry.create({
        data: {
          userId: req.user.id,
          script: summaryScript(selectedItems.map((item) => item.script)),
          contactEmail: contact.email,
          contactPhone: contact.phone,
          message: contact.message,
          items: {
            create: selectedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              script: item.script,
            })),
          },
        },
        include: inquiryInclude,
      });

      await tx.cartItem.deleteMany({
        where: {
          id: { in: selectedIds },
          cartId: cart.id,
        },
      });
      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    return res.status(201).json({ inquiry });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createInquiry,
  createInquiryFromCart,
  getMyInquiries,
  getAllInquiries,
  updateInquiryStatus,
};
