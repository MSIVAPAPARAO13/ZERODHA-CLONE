const express = require("express");
const { createOrder, getOrders } = require("../controllers/orderController");
const { validateOrder } = require("../validators/orderValidator");
const router = express.Router();

router.post("/new", validateOrder, createOrder);
router.get("/", getOrders);

module.exports = router;
