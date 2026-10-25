const prisma = require("../lib/prisma");
const { parsePositiveInt, parseOptionalText } = require("../lib/parsers");

const productInclude = {
  category: true,
};

function buildProductFilters(query, includeUnavailable) {
  const where = {};

  if (!includeUnavailable) {
    where.isAvailable = true;
  } else if (query.isAvailable === "true" || query.isAvailable === "false") {
    where.isAvailable = query.isAvailable === "true";
  }

  const keyword = parseOptionalText(query.search) || parseOptionalText(query.keyword) || parseOptionalText(query.name);
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { description: { contains: keyword } },
    ];
  }

  const categoryId = parsePositiveInt(query.categoryId);
  if (categoryId) {
    where.categoryId = categoryId;
  } else {
    const categoryName = parseOptionalText(query.category);
    if (categoryName) {
      where.category = { name: { contains: categoryName } };
    }
  }

  return where;
}

async function resolveCategoryId(body, { required }) {
  const categoryId = parsePositiveInt(body.categoryId);
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return { error: "הקטגוריה לא נמצאה." };
    }
    return { categoryId };
  }

  if (required) {
    return { error: "יש לשייך את המוצר לקטגוריה (categoryId)." };
  }

  return {};
}

function productPayload(body, { partial = false } = {}) {
  const data = {};

  if (body.name !== undefined || !partial) {
    const name = parseOptionalText(body.name);
    if (!name) {
      return { error: "שם מוצר הוא שדה חובה." };
    }
    data.name = name;
  }

  if (body.description !== undefined || !partial) {
    const description = parseOptionalText(body.description);
    if (!description) {
      return { error: "תיאור מוצר הוא שדה חובה." };
    }
    data.description = description;
  }

  if (body.imageUrl !== undefined || !partial) {
    const imageUrl = parseOptionalText(body.imageUrl);
    if (!imageUrl) {
      return { error: "קישור לתמונה הוא שדה חובה." };
    }
    data.imageUrl = imageUrl;
  }

  if (body.isAvailable !== undefined) {
    if (typeof body.isAvailable !== "boolean") {
      return { error: "isAvailable חייב להיות true או false." };
    }
    data.isAvailable = body.isAvailable;
  } else if (!partial) {
    data.isAvailable = true;
  }

  return { data };
}

async function getProducts(req, res, next) {
  try {
    const includeUnavailable = Boolean(req.user && req.user.role === "ADMIN");
    const where = buildProductFilters(req.query, includeUnavailable);

    const products = await prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { createdAt: "desc" },
    });

    return res.json({ products });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה מוצר לא תקין." });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) {
      return res.status(404).json({ message: "המוצר לא נמצא." });
    }

    const isAdmin = Boolean(req.user && req.user.role === "ADMIN");
    if (!product.isAvailable && !isAdmin) {
      return res.status(404).json({ message: "המוצר לא נמצא." });
    }

    return res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function createProduct(req, res, next) {
  try {
    const payload = productPayload(req.body, { partial: false });
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    const category = await resolveCategoryId(req.body, { required: true });
    if (category.error) {
      return res.status(400).json({ message: category.error });
    }

    const product = await prisma.product.create({
      data: { ...payload.data, categoryId: category.categoryId },
      include: productInclude,
    });
    return res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה מוצר לא תקין." });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "המוצר לא נמצא." });
    }

    const payload = productPayload(req.body, { partial: true });
    if (payload.error) {
      return res.status(400).json({ message: payload.error });
    }

    if (req.body.categoryId !== undefined) {
      const category = await resolveCategoryId(req.body, { required: true });
      if (category.error) {
        return res.status(400).json({ message: category.error });
      }
      payload.data.categoryId = category.categoryId;
    }

    if (Object.keys(payload.data).length === 0) {
      return res.status(400).json({ message: "לא נשלחו שדות לעדכון." });
    }

    const product = await prisma.product.update({
      where: { id },
      data: payload.data,
      include: productInclude,
    });

    return res.json({ product });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה מוצר לא תקין." });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "המוצר לא נמצא." });
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ message: "המוצר נמחק בהצלחה." });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "לא ניתן למחוק מוצר שמופיע בפניות או בסל. ניתן להפוך אותו ללא-פעיל.",
      });
    }
    next(error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
