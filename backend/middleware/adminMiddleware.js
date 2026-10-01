const { UserModel } = require("../models/UserModel");

const adminMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: "Authentication required." }
      });
    }

    const user = await UserModel.findById(userId).lean();
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: "Forbidden: Administrator privileges required." }
      });
    }

    req.adminUser = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = adminMiddleware;
