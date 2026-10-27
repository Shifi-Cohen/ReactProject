require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { attachUser } = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const prisma = require("./lib/prisma");

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
app.use(attachUser);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/inquiries", inquiryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "הנתיב לא נמצא." });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === "entity.parse.failed" || err.status === 400) {
    return res.status(400).json({ message: "גוף הבקשה אינו JSON תקין." });
  }
  res.status(500).json({ message: "שגיאת שרת פנימית." });
});

const server = app.listen(PORT, () => {
  console.log(`Stam server running on http://localhost:${PORT}`);
});

async function shutdown() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
