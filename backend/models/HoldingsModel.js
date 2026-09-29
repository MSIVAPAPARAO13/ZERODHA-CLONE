const { Schema, model } = require("mongoose");

const HoldingsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true },
  avg: { type: Number, required: true },
  price: { type: Number, required: true },
  net: { type: String, required: true },
  day: { type: String, required: true },
  isLoss: { type: Boolean, default: false }
}, { timestamps: true });

const HoldingsModel = model("Holding", HoldingsSchema);
module.exports = { HoldingsModel };
