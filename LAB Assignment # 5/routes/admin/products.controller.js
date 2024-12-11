const express = require("express");
let router = express.Router();

router.get("/admin/product", (req, res) => {
  let products = [
    {
      title: "IPhone",
      price: "One Kidney",
      description: "Sweet Dreams",
      _id: 1,
    },
    {
      title: "Nokia",
      price: "Half Kidney",
      description: "Sweet Dreams/2",
      _id: 1,
    },
  ];
  return res.render("admin/product", {
    layout: "admin-layout",
    pageTitle: "Manage Your Products",
    products,
  });
});

module.exports = router;