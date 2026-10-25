const prisma = require("../lib/prisma");
const { parsePositiveInt, parsePositiveQuantity } = require("../lib/parsers");

const cartInclude = {
  items: {
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: { id: "asc" },
  },
};

async function getOrCreateCart(userId, tx = prisma) {
  const existing = await tx.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (existing) return existing;

  return tx.cart.create({
    data: { userId },
    include: cartInclude,
  });
}

function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) {
    return { error: "יש לשלוח מערך items." };
  }

  const byProductId = new Map();
  for (const item of rawItems) {
    const productId = parsePositiveInt(item.productId);
    const quantity = parsePositiveQuantity(item.quantity);

    if (!productId) {
      return { error: "כל פריט חייב לכלול productId תקין." };
    }
    if (!quantity) {
      return { error: "כמות חייבת להיות מספר שלם חיובי." };
    }

    byProductId.set(productId, (byProductId.get(productId) || 0) + quantity);
  }

  return {
    items: [...byProductId.entries()].map(([productId, quantity]) => ({ productId, quantity })),
  };
}

async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user.id);
    return res.json({ cart });
  } catch (error) {
    next(error);
  }
}

async function addCartItem(req, res, next) {
  try {
    const productId = parsePositiveInt(req.body.productId);
    const quantity = parsePositiveQuantity(req.body.quantity);

    if (!productId) {
      return res.status(400).json({ message: "יש לספק productId תקין." });
    }
    if (!quantity) {
      return res.status(400).json({ message: "כמות חייבת להיות מספר שלם חיובי." });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || !product.isAvailable) {
      return res.status(400).json({ message: "המוצר אינו זמין להוספה לסל." });
    }

    const cart = await prisma.$transaction(async (tx) => {
      const current = await getOrCreateCart(req.user.id, tx);
      const existingItem = current.items.find((item) => item.productId === productId);

      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        await tx.cartItem.create({
          data: {
            cartId: current.id,
            productId,
            quantity,
          },
        });
      }

      await tx.cart.update({
        where: { id: current.id },
        data: { updatedAt: new Date() },
      });

      return tx.cart.findUnique({
        where: { id: current.id },
        include: cartInclude,
      });
    });

    return res.status(201).json({ cart });
  } catch (error) {
    next(error);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const itemId = parsePositiveInt(req.params.itemId);
    const quantity = Number(req.body.quantity);

    if (!itemId) {
      return res.status(400).json({ message: "מזהה פריט לא תקין." });
    }
    if (!Number.isInteger(quantity) || quantity < 0) {
      return res.status(400).json({ message: "כמות חייבת להיות מספר שלם." });
    }

    const cart = await prisma.$transaction(async (tx) => {
      const current = await getOrCreateCart(req.user.id, tx);
      const item = current.items.find((entry) => entry.id === itemId);
      if (!item) {
        return { notFound: true };
      }

      if (quantity === 0) {
        await tx.cartItem.delete({ where: { id: itemId } });
      } else {
        await tx.cartItem.update({
          where: { id: itemId },
          data: { quantity },
        });
      }

      await tx.cart.update({
        where: { id: current.id },
        data: { updatedAt: new Date() },
      });

      return tx.cart.findUnique({
        where: { id: current.id },
        include: cartInclude,
      });
    });

    if (cart.notFound) {
      return res.status(404).json({ message: "הפריט לא נמצא בסל." });
    }

    return res.json({ cart });
  } catch (error) {
    next(error);
  }
}

async function deleteCartItem(req, res, next) {
  try {
    const itemId = parsePositiveInt(req.params.itemId);
    if (!itemId) {
      return res.status(400).json({ message: "מזהה פריט לא תקין." });
    }

    const cart = await prisma.$transaction(async (tx) => {
      const current = await getOrCreateCart(req.user.id, tx);
      const item = current.items.find((entry) => entry.id === itemId);
      if (!item) {
        return { notFound: true };
      }

      await tx.cartItem.delete({ where: { id: itemId } });
      await tx.cart.update({
        where: { id: current.id },
        data: { updatedAt: new Date() },
      });

      return tx.cart.findUnique({
        where: { id: current.id },
        include: cartInclude,
      });
    });

    if (cart.notFound) {
      return res.status(404).json({ message: "הפריט לא נמצא בסל." });
    }

    return res.json({ cart });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await prisma.$transaction(async (tx) => {
      const current = await getOrCreateCart(req.user.id, tx);
      await tx.cartItem.deleteMany({ where: { cartId: current.id } });
      await tx.cart.update({
        where: { id: current.id },
        data: { updatedAt: new Date() },
      });
      return tx.cart.findUnique({
        where: { id: current.id },
        include: cartInclude,
      });
    });

    return res.json({ cart });
  } catch (error) {
    next(error);
  }
}

async function mergeCart(req, res, next) {
  try {
    const parsed = normalizeCartItems(req.body.items);
    if (parsed.error) {
      return res.status(400).json({ message: parsed.error });
    }

    if (parsed.items.length === 0) {
      const cart = await getOrCreateCart(req.user.id);
      return res.json({ cart, skippedProductIds: [] });
    }

    const productIds = parsed.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const available = new Map(
      products.filter((product) => product.isAvailable).map((product) => [product.id, product]),
    );
    const skippedProductIds = productIds.filter((id) => !available.has(id));

    const cart = await prisma.$transaction(async (tx) => {
      const current = await getOrCreateCart(req.user.id, tx);
      const existingByProduct = new Map(current.items.map((item) => [item.productId, item]));

      for (const item of parsed.items) {
        if (!available.has(item.productId)) continue;

        const existing = existingByProduct.get(item.productId);
        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + item.quantity },
          });
        } else {
          const created = await tx.cartItem.create({
            data: {
              cartId: current.id,
              productId: item.productId,
              quantity: item.quantity,
            },
          });
          existingByProduct.set(item.productId, created);
        }
      }

      await tx.cart.update({
        where: { id: current.id },
        data: { updatedAt: new Date() },
      });

      return tx.cart.findUnique({
        where: { id: current.id },
        include: cartInclude,
      });
    });

    return res.json({ cart, skippedProductIds });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getOrCreateCart,
  cartInclude,
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  mergeCart,
};
