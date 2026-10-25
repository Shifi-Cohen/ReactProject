const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  mergeCart,
} = require("../controllers/cartController");

const router = express.Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/items", addCartItem);
router.put("/items/:itemId", updateCartItem);
router.delete("/items/:itemId", deleteCartItem);
router.post("/merge", mergeCart);
router.delete("/", clearCart);

module.exports = router;
