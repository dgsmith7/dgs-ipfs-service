import express from "express";
import { auth, authorize } from "../middleware/auth.js";
import { apiContent } from "../public/js/apidocsdata.js";
import User from "../models/UserModel.js";
import Profile from "../models/ProfileModel.js";
import { initUserData, getUserData } from "../models/UserDataModel.js";
import loadUserData from "../middleware/loadUserData.js";
import {
  unpin,
  sendMessage,
  refreshAllPins,
  getNodeStats,
} from "../utils/util.js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import AllowedUser from "../models/AllowedUser.js";

const router = express.Router();

// Use JWT auth and user data loader middleware
router.use(auth, loadUserData);

// Simple protected endpoint
router.get("/basic", authorize(["basic", "admin"]), (req, res, next) => {
  try {
    res.json({ msg: "Welcome, basic user!" });
  } catch (err) {
    logger.error("Error in basic endpoint:", err);
    next(err);
  }
});

// Render profile (returns EJS view)
router.get(
  "/profile",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      res.render("profile.ejs", {
        user: req.user,
        profile: req.userData.profile,
        pins: req.userData.userPins,
      });
    } catch (err) {
      logger.error("Error rendering profile:", err);
      next(err);
    }
  }
);

// Refresh profile: update DB profile based on computed data then reinitialize in-memory data
router.get(
  "/profile/refresh",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      const freshData = await getUserData(req.user.username);
      await Profile.findOneAndUpdate(
        { username: req.user.username },
        { volume: freshData.profile.volume, lastlogin: new Date() },
        { new: true }
      );
      await initUserData(req.user.username);
      res.redirect("/protected/profile");
    } catch (err) {
      logger.error("Error refreshing profile:", err);
      next(err);
    }
  }
);

// Render API docs page using the API content from docs
router.get(
  "/apidocs",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      res.render("apidocs.ejs", { content: apiContent });
    } catch (err) {
      logger.error("Error rendering API docs:", err);
      next(err);
    }
  }
);

// Contact endpoint: send message via nodemailer using env credentials
router.post(
  "/contact",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      const { message } = req.body;
      const subject = `Message from ${req.user.username} via Smitty's Contact Form`;
      const recipient = process.env.SMITTYS_EMAIL;
      await sendMessage(subject, message, recipient);
      res.status(200).json({ msg: "Message sent successfully" });
    } catch (err) {
      logger.error("Error sending contact message:", err);
      next(err);
    }
  }
);

// Delete account by unpinning all pins, deleting user and profile, then clearing cookie
router.post(
  "/profile/deleteAccount",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      const cids = req.userData.userPins.map((pin) => pin.cid);
      const batchSize = 10;
      for (let i = 0; i < cids.length; i += batchSize) {
        const batch = cids.slice(i, i + batchSize);
        await unpin(batch);
      }
      await User.findByIdAndDelete(req.user.id);
      await Profile.deleteOne({ username: req.user.username });
      res.clearCookie("token");
      res.json({ msg: "Account deleted successfully" });
    } catch (err) {
      logger.error("Error deleting account:", err);
      next(err);
    }
  }
);

// Generate new API key and update user record with hashed key
router.post(
  "/profile/generateApiKey",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      const rawKey = uuidv4();
      const hashedKey = await bcrypt.hash(rawKey, 10);
      await User.findByIdAndUpdate(
        req.user.id,
        { apikey: hashedKey },
        { new: true }
      );
      res.status(200).json({ apiKey: rawKey });
    } catch (err) {
      logger.error("Error generating API key:", err);
      next(err);
    }
  }
);

// Add unpin batch endpoint
router.post(
  "/profile/unpinBatch",
  authorize(["basic", "admin"]),
  async (req, res, next) => {
    try {
      const { cids } = req.body;
      if (!cids || !Array.isArray(cids) || cids.length === 0) {
        return res.status(400).json({
          msg: "No CIDs provided. Received: " + JSON.stringify(req.body),
        });
      }
      console.log("CIDs array received:", cids);
      await unpin(cids);
      res.status(200).json({ msg: "Pins removed successfully" });
    } catch (err) {
      logger.error("Error in unpinBatch:", err);
      next(err);
    }
  }
);

// Add admin dashboard endpoint
router.get("/admin", authorize(["admin"]), async (req, res, next) => {
  try {
    const pins = await refreshAllPins();
    const users = await Profile.find();
    const nodeStats = await getNodeStats();
    const allowedUsers = await AllowedUser.find().lean();
    res.render("adminDashboard.ejs", {
      pins,
      users,
      nodeStats,
      allowedUsers,
    });
  } catch (err) {
    logger.error("Error rendering admin dashboard:", err);
    next(err);
  }
});

// New endpoint to add an allowed user
router.post("/admin/allowed", authorize(["admin"]), async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email required" });
    // Create allowed user document
    await AllowedUser.create({ email });
    res.status(201).json({ msg: "Allowed user added successfully" });
  } catch (err) {
    logger.error("Error adding allowed user:", err);
    next(err);
  }
});

// Endpoint to place a hold on a user (admin action)
router.put("/admin/hold", authorize(["admin"]), async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ msg: "Username required" });
    const profile = await Profile.findOne({ username });
    if (!profile) return res.status(404).json({ msg: "Profile not found" });
    profile.status = "hold";
    profile.holddates = profile.holddates || [];
    profile.holdreasons = profile.holdreasons || [];
    profile.holddates.push(new Date());
    profile.holdreasons.push("Admin hold");
    await profile.save();
    res.status(200).json({ msg: "User put on hold", profile });
  } catch (err) {
    logger.error("Error placing user on hold:", err);
    next(err);
  }
});

// Endpoint to release a user's hold (admin action)
router.put("/admin/release", authorize(["admin"]), async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ msg: "Username required" });
    const profile = await Profile.findOne({ username });
    if (!profile) return res.status(404).json({ msg: "Profile not found" });
    profile.status = "free";
    await profile.save();
    res.status(200).json({ msg: "User hold released", profile });
  } catch (err) {
    logger.error("Error releasing hold:", err);
    next(err);
  }
});

// Endpoint to delete a user (admin action)
// This unpins all pins with that user's cidname and then deletes the user and profile.
router.delete(
  "/admin/deleteUser",
  authorize(["admin"]),
  async (req, res, next) => {
    try {
      const { username } = req.body;
      if (!username) return res.status(400).json({ msg: "Username required" });
      const user = await User.findOne({ username });
      const profile = await Profile.findOne({ username });
      if (!user || !profile)
        return res.status(404).json({ msg: "User or profile not found" });
      const ownerString = user.cidname;
      const allPins = await refreshAllPins();
      // Filter pins belonging to the user based on cidname string contained in the pin name.
      const userPins = allPins.filter((pin) => pin.name.includes(ownerString));
      const cids = userPins.map((pin) => pin.cid);
      if (cids.length > 0) {
        await unpin(cids);
      }
      // Delete user and profile
      await User.deleteOne({ username });
      await Profile.deleteOne({ username });
      res.status(200).json({ msg: "User deleted successfully" });
    } catch (err) {
      logger.error("Error deleting user:", err);
      next(err);
    }
  }
);

export default router;
