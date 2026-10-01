const express = require("express");
const { createOrder, getOrders } = require("../controllers/orderController");
const { validateOrder } = require("../validators/orderValidator");
const idempotencyMiddleware = require("../middleware/idempotencyMiddleware");
const router = express.Router();

router.post("/new", validateOrder, idempotencyMiddleware, createOrder);
router.post("/", validateOrder, idempotencyMiddleware, createOrder);
router.get("/", getOrders);

module.exports = router;
