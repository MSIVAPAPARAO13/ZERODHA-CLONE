const { model } = require("mongoose");
const { PositionsSchema } = require("../schemas/PositionsSchema");

const PositionsModel = model("Position", PositionsSchema);
module.exports = { PositionsModel };
