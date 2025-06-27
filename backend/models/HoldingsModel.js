const { model } = require("mongoose");
const { HoldingsSchema } = require("../schemas/HoldingsSchema");

const HoldingsModel = model("Holding", HoldingsSchema); // ✅ Capitalized and correct
module.exports = { HoldingsModel };
