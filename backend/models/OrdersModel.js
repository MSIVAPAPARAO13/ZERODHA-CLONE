const { model } = require("mongoose");
const { OrdersSchema } = require("../schemas/OrderSchema");   // ✅ matches your file


const OrdersModel = model("Order", OrdersSchema); // ✅ Correct – no `new`

module.exports = { OrdersModel };
