const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { updateUser } = require("../controllers/userController");

const router = express.Router();

router.put("/:id", requireAuth, updateUser);

module.exports = router;
