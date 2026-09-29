const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  virtualBalance: { type: Number, default: 100000 }
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);

module.exports = { UserModel };
