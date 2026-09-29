const { Schema, model } = require("mongoose");

const OrderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  mode: { type: String, enum: ['BUY', 'SELL'], required: true },
}, { timestamps: true });

const OrdersModel = model("Order", OrderSchema);
module.exports = { OrdersModel };
