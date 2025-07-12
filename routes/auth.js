const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Otp = require("../models/otp");
const sendEmail = require("../utils/sendEmail");
const passport = require('passport');
const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email, password, phone, country } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      country,
    });

    await user.save();

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
router.get("/allusers", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.put("/update/:id", async (req, res) => {
  const { username, email, phone, country, password } = req.body;
  const updateFields = {};

  // Collect fields to update
  if (username) updateFields.username = username;
  if (email) updateFields.email = email;
  if (phone) updateFields.phone = phone;
  if (country) updateFields.country = country;

  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ msg: "User updated successfully", updatedUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    await Otp.deleteMany({ email }); // remove old OTPs

    const otp = new Otp({ email, code: otpCode, expiresAt });
    await otp.save();

    await sendEmail(email, otpCode, "login");

    res.json({ msg: "OTP sent to your email. Please verify." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
router.post("/verify-otp", async (req, res) => {
  const { email, code } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, code });

    if (!otpRecord) {
      return res.status(400).json({ msg: "Invalid or expired OTP" });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP has expired" });
    }

    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ msg: "OTP verified. Login successful." });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ msg: "No account found with this email" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email });

    const newOtp = new Otp({
      email,
      code: otpCode,
      expiresAt,
    });

    await newOtp.save();
    await sendEmail(email, otpCode, "forgot-password");

    res.json({ msg: "OTP sent to your email for password reset" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const otpRecord = await Otp.findOne({ email, code });

    if (!otpRecord)
      return res.status(400).json({ msg: "Invalid or expired OTP" });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ msg: "OTP has expired" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    //Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ msg: "New password cannot be the same as the old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { $set: { password: hashedPassword } });
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Step 1: Redirect to Google for authentication
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Step 2: Handle Google callback
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.json({
      msg: 'Login successful with Google',
      user: req.user,
      isNewUser: req.user.createdAt.getTime() > Date.now() - 10000 // crude 10s check
    });
  }
);

module.exports = router;
