const express = require('express');
const routers = express.Router();

//Bycription
const bcrypt = require('bcrypt');


// Models
let Product = require("../../models/productsmodel");
let User = require("../../models/usersmodel");


// Route to show all Featured products
routers.get('/user/userproducts', async (req, res) => {
  try {
    const products = await Product.find({ isSold: false });
    const user = req.session?.user || null;
    const currentUserId = req.session?.user || null;
    res.render('user/userproducts', {
      products,
      user,
      currentUserId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to show all sold products
routers.get('/user/usersoldproducts', async (req, res) => {
  try {
    const products = await Product.find({ isSold: true });
    const user = req.session?.user || null;
    res.render('user/usersoldproducts', {
      products,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


//GET:Products Details
routers.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).send("Product not found");

    const from = req.query.from || "all"; // default to 'all'
    res.render("user/userproductsdetail", { product, from });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading product");
  }
});


// Logout (optional)
routers.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/landingpage");
  });
});

// GET Login page
routers.get("/user/userlogin", (req, res) => {
  res.render("user/userlogin");
});

// POST: Login user
routers.post('/user/userlogin',async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('user/userlogin', { message: 'Invalid email or password' });
    }

    // 2. Compare password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('user/userlogin', { message: 'Invalid email or password' });
    }

    // 3. Set session or token (example using session)
   req.session.user = {
  _id: user._id,
  name: user.name, // this will be shown in navbar
  email: user.email
};

    // Redirect to home or dashboard
    return res.redirect('/');

  } catch (err) {
    console.error(err);
    return res.render('user/login', { message: 'An error occurred. Please try again.' });
  }
});


// GET SignUp page
routers.get("/user/usersignup", (req, res) => {
  res.render("user/usersignup");
});

// POST: User Signup
routers.post('/user/usersignup', async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      phone,
      address,
      password: hashedPassword
    });

    await newUser.save();

    // Redirect or send success
    res.redirect('/user/userlogin'); // 🔁 or send success JSON if using API
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Logout (optional)
routers.get("/user/userlogout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

routers.get("/user/userproducts/wishlistedproducts", async (req, res) => {
  const userId = req.session.user?._id;
  const user = req.session?.user || null;
  if (!userId) return res.redirect("/user/userlogin");

  try {
    const wishlistedProducts = await Product.find({ wishlistedBy: userId });
    res.render("user/wishlistedproducts", { wishlistedProducts, currentUserId: userId, user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading wishlist");
  }
});


// POST: Add to wishlist
routers.post('/user/userproducts/wishlist/:id', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/user/userlogin'); // Redirect to login if user not authenticated
  }

  const userId = req.session.user._id;
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Optional improvement: Convert all IDs to strings for safe comparison
    const alreadyWishlisted = product.wishlistedBy
      .map(id => id.toString())
      .includes(userId.toString());

    if (!alreadyWishlisted) {
      product.wishlistedBy.push(userId);
      await product.save();
    }

    res.redirect('/user/userproducts'); // Redirect to the product listing page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST: Remove product from wishlist
routers.post('/user/userproducts/wishlistedproducts/unwishlist/:id', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/user/userlogin'); // Redirect if not logged in
  }

  const userId = req.session.user._id;
  const productId = req.params.id;

  try {
    await Product.findByIdAndUpdate(productId, {
      $pull: { wishlistedBy: userId }
    });

    res.redirect('/user/userproducts/wishlistedproducts'); // Redirect to previous page or wishlist
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error while removing from wishlist');
  }
});


// Post: Like
routers.post('/user/userproducts/like/:id', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/user/userlogin');
  }

  const userId = req.session.user._id;
  const productId = req.params.id;

  try {
    const product = await Product.findById(productId);

    if (!product) return res.status(404).send("Product not found");

    const index = product.likes.indexOf(userId);
    if (index > -1) {
      // Already liked, remove the like
      product.likes.splice(index, 1);
    } else {
      // Not liked, add the like
      product.likes.push(userId);
    }

    await product.save();
    res.redirect('/user/userproducts');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


module.exports = routers;