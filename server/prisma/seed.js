// סקריפט שממלא את מסד הנתונים בנתוני התחלה: מנהל, קטגוריות וקולמוסים.
// הרצה (מתוך תיקיית server):  npm run seed
// בטוח להריץ כמה פעמים – לא יוצר כפילויות, ומסיר את קטלוג הסת"ם הישן אם הוא עדיין קיים.
require("dotenv").config();

const { hashPassword } = require("../src/lib/auth");
const prisma = require("../src/lib/prisma");

// משתמשי הדמו נקראים מ-.env, כדי שהסיסמאות לא יישמרו בקוד.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;

const OLD_CATEGORY_NAMES = ["מזוזות", "תפילין", "מגילות", "ספרי תורה", "קולמוסים"];

const categories = [
  { name: "קולמוס לספר תורה", description: "קולמוסים קרמיים לכתיבת ספר תורה" },
  { name: "קולמוס למגילה", description: "קולמוסים קרמיים לכתיבת מגילה" },
  { name: "קולמוס למזוזה", description: "קולמוסים קרמיים לכתיבת מזוזה" },
  { name: "קולמוס לתפילין", description: "קולמוסים קרמיים לכתיבת תפילין" },
  { name: "קולמוסים שונים", description: "קולמוסים קרמיים לייעודים נוספים" },
];

const image = (text) => `https://placehold.co/600x400/0A2240/C5A059?text=${encodeURIComponent(text)}`;

const products = [
  { name: "קולמוס לספר תורה 56 ס״מ", category: "קולמוס לספר תורה", description: "קולמוס קרמי לכתיבת ספר תורה בגובה 56 ס״מ." },
  { name: "קולמוס לספר תורה 48 ס״מ", category: "קולמוס לספר תורה", description: "קולמוס קרמי לכתיבת ספר תורה בגובה 48 ס״מ." },
  { name: "קולמוס לספר תורה 42 ס״מ", category: "קולמוס לספר תורה", description: "קולמוס קרמי לכתיבת ספר תורה בגובה 42 ס״מ." },
  { name: "קולמוס לספר תורה 36 ס״מ", category: "קולמוס לספר תורה", description: "קולמוס קרמי לכתיבת ספר תורה בגובה 36 ס״מ." },
  { name: "קולמוס לספר תורה 30 ס״מ", category: "קולמוס לספר תורה", description: "קולמוס קרמי לכתיבת ספר תורה בגובה 30 ס״מ." },
  { name: "קולמוס למגילה 10 מ״מ", category: "קולמוס למגילה", description: "קולמוס קרמי למגילה, מידה 10 מ״מ." },
  { name: "קולמוס למגילה 8 מ״מ", category: "קולמוס למגילה", description: "קולמוס קרמי למגילה, מידה 8 מ״מ." },
  { name: "קולמוס למגילה 6 מ״מ", category: "קולמוס למגילה", description: "קולמוס קרמי למגילה, מידה 6 מ״מ." },
  { name: "קולמוס למגילה 4 מ״מ", category: "קולמוס למגילה", description: "קולמוס קרמי למגילה, מידה 4 מ״מ." },
  { name: "קולמוס למזוזה 15 ס״מ", category: "קולמוס למזוזה", description: "קולמוס קרמי למזוזה בגודל 15 ס״מ." },
  { name: "קולמוס למזוזה 12 ס״מ", category: "קולמוס למזוזה", description: "קולמוס קרמי למזוזה בגודל 12 ס״מ." },
  { name: "קולמוס למזוזה 10 ס״מ", category: "קולמוס למזוזה", description: "קולמוס קרמי למזוזה בגודל 10 ס״מ." },
  { name: "קולמוס למזוזה 20 ס״מ", category: "קולמוס למזוזה", description: "קולמוס קרמי למזוזה בגודל 20 ס״מ." },
  { name: "קולמוס לתפילין של ראש", category: "קולמוס לתפילין", description: "קולמוס קרמי לכתיבת תפילין של ראש." },
  { name: "קולמוס לתפילין של יד", category: "קולמוס לתפילין", description: "קולמוס קרמי לכתיבת תפילין של יד." },
  { name: "קולמוס לתפילין של ראש פצונים", category: "קולמוס לתפילין", description: "קולמוס קרמי לכתיבת תפילין של ראש פצונים." },
  { name: "קולמוס לתפילין של יד פצונים", category: "קולמוס לתפילין", description: "קולמוס קרמי לכתיבת תפילין של יד פצונים." },
  { name: "קולמוס לעשרת בני המן", category: "קולמוסים שונים", description: "קולמוס קרמי לכתיבת עשרת בני המן." },
  { name: "קולמוס לתיג", category: "קולמוסים שונים", description: "קולמוס קרמי לתיג." },
];

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !USER_EMAIL || !USER_PASSWORD) {
    throw new Error("חסרים פרטי משתמשי הדמו בקובץ server/.env");
  }

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: {
      email: ADMIN_EMAIL,
      fullName: "מנהל האתר",
      password: await hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      email: USER_EMAIL,
      fullName: "שרה כהן",
      phone: "050-1234567",
      password: await hashPassword(USER_PASSWORD),
    },
  });

  const categoryIds = {};
  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    categoryIds[category.name] = saved.id;
  }

  const oldCategories = await prisma.category.findMany({
    where: { name: { in: OLD_CATEGORY_NAMES } },
    select: { id: true },
  });
  const oldCategoryIds = oldCategories.map((category) => category.id);
  if (oldCategoryIds.length > 0) {
    const oldProducts = await prisma.product.findMany({
      where: { categoryId: { in: oldCategoryIds } },
      select: { id: true },
    });
    const oldProductIds = oldProducts.map((product) => product.id);
    if (oldProductIds.length > 0) {
      await prisma.cartItem.deleteMany({ where: { productId: { in: oldProductIds } } });
      await prisma.inquiryItem.deleteMany({ where: { productId: { in: oldProductIds } } });
      await prisma.product.deleteMany({ where: { id: { in: oldProductIds } } });
    }
    await prisma.category.deleteMany({ where: { id: { in: oldCategoryIds } } });
  }

  for (const { category, ...product } of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) continue;
    await prisma.product.create({
      data: { ...product, categoryId: categoryIds[category], imageUrl: image(product.name) },
    });
  }

  console.log("משתמשי הדמו, הקטגוריות והקולמוסים מוכנים. פרטי הכניסה נמצאים ב-README.md");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
