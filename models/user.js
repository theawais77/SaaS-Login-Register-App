const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
    lowercase: true, 
    trim: true,
  },
  password: { type: String, required: true, Minlength: 6 },
  phone: { type: String, required: true},
  country: { type: String, required: true ,trim: true},
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
