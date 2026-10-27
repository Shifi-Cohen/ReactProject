const express = require("express");
const { requireAdmin, requireAuth } = require("../middleware/auth");
const { inquiryLimiter } = require("../middleware/inquiryRateLimit");
const {
  createInquiry,
  createInquiryFromCart,
  getMyInquiries,
  getAllInquiries,
  updateInquiryStatus,
} = require("../controllers/inquiryController");

const router = express.Router();

router.post("/from-cart", inquiryLimiter, requireAuth, createInquiryFromCart);
router.post("/", inquiryLimiter, createInquiry);
router.get("/my-inquiries/:userId", requireAuth, getMyInquiries);
router.get("/", requireAdmin, getAllInquiries);
router.put("/:id/status", requireAdmin, updateInquiryStatus);

module.exports = router;
