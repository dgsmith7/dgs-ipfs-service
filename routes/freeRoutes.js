import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import Profile from "../models/ProfileModel.js"; // new import
import { initUserData } from "../models/UserDataModel.js"; // new import
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { signOut } from "../middleware/auth.js";
import { apiContent } from "../public/js/apidocsdata.js";
import {
  loadPinSizes,
  sendOtp,
  validateOtp,
  getNodeStats,
  sendMessage,
} from "../utils/util.js";
import AllowedUser from "../models/AllowedUser.js"; // new import
import logger from "../config/logger.js";

dotenv.config();

const router = express.Router();

// Updated "/" endpoint: Check for valid access token from cookie.
router.get("/", async (req, res) => {
  try {
    if (req.cookies && req.cookies.token) {
      const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      if (payload) return res.redirect("/protected/profile");
    }
  } catch (error) {
    res.clearCookie("token");
    res.clearCookie("refreshToken");
  }
  res.redirect("/login");
});

// Updated "/login" endpoint: Check for valid access token.
router.get("/login", async (req, res) => {
  try {
    if (req.cookies && req.cookies.token) {
      const payload = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      if (payload) return res.redirect("/protected/profile");
    }
  } catch (error) {
    res.clearCookie("token");
    res.clearCookie("refreshToken");
  }
  res.render("login.ejs", { user: req.user });
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.render("login.ejs", { error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login.ejs", { error: "Invalid credentials" });
    }
    const payload = { id: user.id, role: user.role };
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
      expiresIn: "7d",
    });
    // Set both the refresh token and the access token as HTTP-only cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    await initUserData(user.username);
    logger.info(`User ${req.body.username} logged in successfully.`);
    res.status(201).json({ msg: "User logged in successfully", token });
  } catch (err) {
    logger.error("Error during login:", err);
    next(err);
  }
});

// New endpoint: Refresh Token
router.post("/refresh-token", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ msg: "No refresh token" });
    }
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newPayload = { id: payload.id, role: payload.role };
    // Generate new tokens using only environment tokens
    const newToken = jwt.sign(newPayload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    const newRefreshToken = jwt.sign(
      newPayload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );
    // Update refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });
    res.status(200).json({ token: newToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(401).json({ msg: "Invalid refresh token" });
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const role = "basic";
    const rawkey = uuidv4();
    const apikey = await bcrypt.hash(rawkey, 10);
    const cidname = `DGSC-${rawkey.substring(0, 4)}${username
      .split("@")[0]
      .substring(0, 4)}-`;

    // Check allowed users from the database
    const allowedUser = await AllowedUser.findOne({ email: username });
    if (!allowedUser) {
      return res.status(400).json({ msg: "User not allowed" });
    }

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    user = new User({ username, password, role, apikey, cidname });
    await user.save();

    // Create a new profile document for this user
    const profileData = {
      username: username,
      status: "free",
      holddates: [],
      holdreasons: [],
      started: new Date(),
      lastlogin: new Date(),
      volume: 0,
      capacity: 1000,
    };
    await Profile.create(profileData);

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    logger.error("Error during registration:", err);
    next(err);
  }
});

router.post("/sendotp", async (req, res) => {
  try {
    const { recipient } = req.body;
    const userExists = await User.exists({ username: recipient });
    if (userExists) {
      await sendOtp(recipient);
      res.json({ message: "success" });
    } else {
      res.json({ message: "fail" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "fail", error: err.message });
  }
});

router.post("/validateotp", async (req, res) => {
  try {
    const { email, enteredOtp, newPassword } = req.body;
    const response = await validateOtp(email, enteredOtp, newPassword);
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "failure", error: err.message });
  }
});

router.get("/nodeinfo", async (req, res) => {
  try {
    const nodeStats = await getNodeStats();
    res.render("nodeInfo.ejs", {
      nodeStats,
    });
  } catch (err) {
    console.error("Error rendering node page:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

router.get("/logout", signOut);

router.post("/mail", async (req, res) => {
  try {
    const { sub, txt } = req.body;
    const recipient = process.env.MESSAGE_TO;
    console.log("---> ", sub, txt, recipient);
    const messageResponse = await sendMessage(sub, txt, recipient);
    res.status(200).json({ result: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ result: "Email send failed", error: err.message });
  }
});

export default router;
