const prisma = require("../lib/prisma");
const { parsePositiveInt, parseOptionalText } = require("../lib/parsers");

async function getCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    });

    return res.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        productCount: category._count.products,
      })),
    });
  } catch (error) {
    next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const name = parseOptionalText(req.body.name);
    if (!name) {
      return res.status(400).json({ message: "שם קטגוריה הוא שדה חובה." });
    }

    const description = req.body.description === undefined
      ? undefined
      : parseOptionalText(req.body.description);

    const category = await prisma.category.create({
      data: {
        name,
        description: description ?? null,
      },
    });

    return res.status(201).json({ category });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "קטגוריה בשם זה כבר קיימת." });
    }
    next(error);
  }
}

async function updateCategory(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה קטגוריה לא תקין." });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "הקטגוריה לא נמצאה." });
    }

    const data = {};
    if (req.body.name !== undefined) {
      const name = parseOptionalText(req.body.name);
      if (!name) {
        return res.status(400).json({ message: "שם קטגוריה לא יכול להיות ריק." });
      }
      data.name = name;
    }
    if (req.body.description !== undefined) {
      data.description = parseOptionalText(req.body.description);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: "לא נשלחו שדות לעדכון." });
    }

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return res.json({ category });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "קטגוריה בשם זה כבר קיימת." });
    }
    next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "מזהה קטגוריה לא תקין." });
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      return res.status(404).json({ message: "הקטגוריה לא נמצאה." });
    }
    if (existing._count.products > 0) {
      return res.status(409).json({
        message: "לא ניתן למחוק קטגוריה שיש בה מוצרים. יש להעביר או למחוק את המוצרים קודם.",
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ message: "הקטגוריה נמחקה בהצלחה." });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "לא ניתן למחוק קטגוריה שיש בה מוצרים.",
      });
    }
    next(error);
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
