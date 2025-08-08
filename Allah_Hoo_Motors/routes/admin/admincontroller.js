const express = require('express');
const router = express.Router();

// Multer
let multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Directory to store files
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique file name
  },
});
const upload = multer({ storage: storage });

// Models
let Product = require("../../models/productsmodel");
let User = require("../../models/usersmodel");
let Complain = require("../../models/complainmodel");

//Bycription
const bcrypt = require('bcrypt');

// GET: Admin Panel Dashboard
router.get("/admin/adminpanel", (req, res) => {
  // You can fetch admin info from session or request if using login
  const admin = req.session.admin || { name: "Admin" }; // adjust based on your session logic

  res.render("admin/adminpanel", { admin }); // Make sure this matches your EJS file name
});



router.get("/admin/adminproducts", async (req, res) => {
  try {
    // Fetch unsold products to display in the product table
    const products = await Product.find({ isSold: false });

    // Fetch sold products for gross summary
    const soldProducts = await Product.find({ isSold: true, soldDate: { $ne: null } }).lean();


    // Flatten values from saleHistory[0] into each sold product
    soldProducts.forEach(p => {
      if (p.saleHistory?.length > 0) {
        const sale = p.saleHistory[0];
        p.soldPrice = sale.soldPrice;
        p.soldDate = sale.date;
        p.gross = sale.gross;
        p.soldByName = sale.soldByName || 'N/A';
        p.ownedBy = sale.ownedBy || p.ownedBy; // In case you want to trust sale history's ownership
        p.cost = sale.cost; // Use cost from sale record
        p.commissionPercent = sale.commissionPercent || 0;
      }
    });

    // Setup months and years
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => (currentYear - i).toString());

    const selectedMonth = req.query.filterMonth || "";
    const selectedYear = req.query.filterYear || "";

    const monthlyBreakdown = {};
    const monthlyGross = {};

    // Filter by selected month/year
    const filteredSoldProducts = soldProducts.filter(p => {
      const date = new Date(p.soldDate);
      const monthMatch = selectedMonth ? selectedMonth === date.toLocaleString('default', { month: 'long' }) : true;
      const yearMatch = selectedYear ? selectedYear === date.getFullYear().toString() : true;
      return monthMatch && yearMatch;
    });

    // Monthly breakdown + gross
    filteredSoldProducts.forEach(p => {
      const date = new Date(p.soldDate);
      const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

      if (!monthlyBreakdown[monthYear]) {
        monthlyBreakdown[monthYear] = [];
        monthlyGross[monthYear] = 0;
      }

      monthlyBreakdown[monthYear].push(p);

      const gross = p.ownedBy === "Allah Hoo Motors"
        ? (p.soldPrice || 0) - (p.cost || 0)
        : ((p.soldPrice || 0) * (p.commissionPercent || 0)) / 100;

      monthlyGross[monthYear] += gross;
    });

    // Total gross
    const totalGross = filteredSoldProducts.reduce((sum, p) => {
      const gross = p.ownedBy === "Allah Hoo Motors"
        ? (p.soldPrice || 0) - (p.cost || 0)
        : ((p.soldPrice || 0) * (p.commissionPercent || 0)) / 100;
      return sum + gross;
    }, 0);

    const totalSold = filteredSoldProducts.length;
    const totalOwned = products.filter(p => p.ownedBy === "Allah Hoo Motors").length;
    const totalDealer = products.filter(p => p.ownedBy !== "Allah Hoo Motors").length;

    res.render("admin/adminproducts", {
      products,              // unsold products
      months,
      years,
      selectedMonth,
      selectedYear,
      monthlyBreakdown,
      monthlyGross,
      totalGross,
      totalSold,
      totalOwned,
      totalDealer
    });

  } catch (err) {
    console.error("Error loading admin products:", err);
    res.status(500).send("Server error");
  }
});




//GET:Products Details
router.get("/product/:id", async (req, res) => {
  const product = await Product.findById(req.params.id).populate('addedBy').populate('editedBy');
  if (!product) return res.status(404).send("Product not found");

  const from = req.query.from || null; // 👈 Get from query string

  res.render("admin/adminproductsdetail", { product, from });
});




//GET: Create Products
router.get("/admin/adminproducts/create", async (req, res) => {
  try {
    res.render("admin/createproducts", {
      layout: "adminlayout",
      pageTitle: "Create New Product",
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).send("Internal Server Error");
  }
});

// POST: Create Product
router.post("/admin/adminproducts/create", upload.array("files", 100), async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      stock,
      registrationCity,
      engineType,
      engineCapacity,
      transmission,
      condition,
      brand,
      model,
      year,
      ownedBy,
      cost,
      commissionPercent,
      buyDate
    } = req.body;

    // Process features (checkboxes)
    let features = req.body.features || [];
    if (!Array.isArray(features)) features = [features];

    // Process images
    const pictures = req.files ? req.files.map(file => file.filename) : [];

    // Validate required fields
    if (
      !title || !price || !stock || !brand || !model ||
      !year || !ownedBy || !buyDate
    ) {
      return res.status(400).send("Missing required fields.");
    }

    // Parse values
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock);
    const parsedCost = cost ? parseFloat(cost) : undefined;
    const parsedCommission = commissionPercent ? parseFloat(commissionPercent) : undefined;
    const parsedBuyDate = new Date(buyDate);

    const adminId = req.session.admin?._id;
        if (!adminId) {
        return res.status(401).send("Unauthorized: Admin session not found");
}

    // Construct new product
    const newProduct = new Product({
      title,
      description,
      price: parsedPrice,
      stock: parsedStock,
      registrationCity,
      engineType,
      engineCapacity,
      transmission,
      condition,
      features,
      pictures,
      brand,
      model,
      year,
      ownedBy,
      buyDate: parsedBuyDate, // ✅ Save buy date
      addedBy: adminId,
      isSold: false,
      ...(ownedBy === "Allah Hoo Motors"
        ? { cost: parsedCost }
        : { commissionPercent: parsedCommission })
    });

    await newProduct.save();
    return res.redirect("/admin/adminproducts");

  } catch (error) {
    console.error("❌ Error creating product:", error);
    res.status(500).send("Server error");
  }
});



// GET: Edit Form
router.get("/admin/products/edit/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  return res.render("admin/editproducts", {
    product,
  });
});


// POST: Edit Product
router.post("/admin/adminproducts/edit/:id", upload.array("files", 100), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const {
      title,
      description,
      price,
      stock,
      brand,
      model,
      year,
      registrationCity,
      engineType,
      engineCapacity,
      transmission,
      condition,
      ownedBy,
      cost,
      commissionPercent
    } = req.body;

    // Update product fields
    product.title = title;
    product.description = description;
    product.price = parseFloat(price);
    product.stock = parseInt(stock);
    product.brand = brand;
    product.model = model;
    product.year = year;
    product.registrationCity = registrationCity;
    product.engineType = engineType;
    product.engineCapacity = engineCapacity;
    product.transmission = transmission;
    product.condition = condition;
    product.ownedBy = ownedBy;

    // Features
    let features = req.body.features || [];
    if (!Array.isArray(features)) features = [features];
    product.features = features;

    // Cost / Commission
    if (ownedBy === "Allah Hoo Motors") {
      product.cost = parseFloat(cost) || 0;
      product.commissionPercent = undefined;
    } else if (ownedBy === "External Dealer") {
      product.commissionPercent = parseFloat(commissionPercent) || 0;
      product.cost = undefined;
    }

    // Update images if provided
    if (req.files && req.files.length > 0) {
      product.pictures = req.files.map(file => file.filename);
    }

// ✅ Always update editedBy to current admin (even if same as addedBy)
const currentAdminId = req.session.admin?._id;

if (!currentAdminId) {
  return res.status(401).send("Unauthorized: Admin session not found");
}

product.editedBy = currentAdminId;


    await product.save();
    return res.redirect("/admin/adminproducts");
  } catch (err) {
    console.error("❌ Error editing product:", err);
    return res.status(500).send("Server Error");
  }
});


//Get: Delete products
router.post("/admin/adminproducts/delete/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);

  await Product.findByIdAndDelete(req.params.id);
  return res.redirect("/admin/adminproducts");
});

// GET: Sold Products
router.get("/admin/soldproducts", async (req, res) => {
  try {
    const soldProducts = await Product.find({ isSold: true });
    res.render("admin/adminsoldproducts", { products: soldProducts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/admin/adminproducts/markassold/:id", async (req, res) => {
  const { price, commissionPercent, soldByName, soldDate } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");

  product.isSold = true;
  product.price = parseFloat(price); // Allow negotiable sale price
  product.soldByName = soldByName;
  product.soldDate = new Date(soldDate);

  if (product.ownedBy !== 'Allah Hoo Motors') {
    product.commissionPercent = parseFloat(commissionPercent);
  }

  const gross = product.ownedBy === 'Allah Hoo Motors'
    ? product.price - (product.cost || 0)
    : (product.price * (product.commissionPercent || 0)) / 100;

  product.saleHistory = product.saleHistory || [];
  product.saleHistory.push({
    soldPrice: product.price,
    cost: product.cost || 0,
    commissionPercent: product.commissionPercent || 0,
    date: new Date(),
    gross,
    ownedBy: product.ownedBy,
    soldByName: product.soldByName,
  });

  product.isSold = true;
  await product.save();

  return res.redirect("/admin/adminproducts");
});


// POST: Buy Again Logic
router.post("/admin/adminproducts/buyagain/:id", async (req, res) => {
  try {
    const original = await Product.findById(req.params.id);
    if (!original || !original.isSold) {
      return res.status(400).send("Only sold products can be rebought.");
    }

    const { cost, price } = req.body;

    const currentAdmin = req.session.admin?._id;

    const newProduct = new Product({
      title: original.title,
      description: original.description,
      brand: original.brand,
      model: original.model,
      year: original.year,
      registrationCity: original.registrationCity,
      engineType: original.engineType,
      engineCapacity: original.engineCapacity,
      transmission: original.transmission,
      condition: original.condition,
      features: original.features,
      pictures: original.pictures,

      stock: 1,
      isSold: false,
      ownedBy: "Allah Hoo Motors", // rebought = company-owned
      cost: parseFloat(cost),
      price: parseFloat(price),

      // Clear commission info (dealer fields)
      commissionPercent: undefined,
      soldDate: undefined,
      soldByName: undefined,

      // New fields
      addedBy: currentAdmin,
      buyDate: new Date(),
    });

    await newProduct.save();
    res.redirect("/admin/adminproducts");
  } catch (err) {
    console.error("❌ Error in Buy Again:", err);
    res.status(500).send("Server error");
  }
});



router.get("/admin/adminlogin", (req, res) => {
  res.render("admin/adminlogin");
});

// POST: Login user
router.post('/admin/adminlogin',async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('admin/adminlogin', { message: 'Invalid email or password' });
    }

    // 2. Compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('admin/adminlogin', { message: 'Invalid email or password' });
    }

    // 3. Set session or token (example using session)
    req.session.admin = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
};
    if (user.role === "admin") {
    return res.redirect("/admin/adminpanel");
  }

  } catch (err) {
    console.error(err);
    return res.render('admin/adminlogin', { message: 'An error occurred. Please try again.' });
  }
});

// Logout (optional)
router.get("/admin/adminlogout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
  });

// route: /admin/ownedproducts
router.get('/admin/ownedproducts', async (req, res) => {
  try {
    const products = await Product.find({
      ownedBy: 'Allah Hoo Motors',
      isSold: false
    }).lean();

    res.render('admin/ownedproducts', { products });
  } catch (err) {
    console.error('Error fetching owned products:', err);
    res.status(500).send('Server Error');
  }
});

// route: /admin/notownedproducts
router.get('/admin/notownedproducts', async (req, res) => {
  try {
    const products = await Product.find({
      ownedBy: { $ne: 'Allah Hoo Motors' },
      isSold: false
    }).lean();

    res.render('admin/notownedproducts', { products });
  } catch (err) {
    console.error('Error fetching not-owned products:', err);
    res.status(500).send('Server Error');
  }
});

router.get("/admin/receivecomplain", async (req, res) => {
  try {
    const complaints = await Complain.find().sort({ createdAt: -1 });
    res.render("admin/receivecomplain", { complaints });
  } catch (err) {
    console.error("❌ Error retrieving complaints:", err);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;