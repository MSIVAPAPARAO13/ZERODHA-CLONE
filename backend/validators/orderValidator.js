const Joi = require("joi");

const orderSchema = Joi.object({
  name: Joi.string().required().min(1),
  qty: Joi.number().required().positive().integer(),
  price: Joi.number().required().positive(),
  mode: Joi.string().valid("BUY", "SELL").required()
});

const validateOrder = (req, res, next) => {
  const { error } = orderSchema.validate(req.body);
  if (error) {
    res.status(400);
    return next(new Error(error.details[0].message));
  }
  next();
};

module.exports = { validateOrder };
