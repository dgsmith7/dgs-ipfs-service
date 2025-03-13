import express from "express";
import apiAuth from "../middleware/apiAuth.js";
import { sizeCID, pin, unpin, add } from "../utils/util.js";
import Profile from "../models/ProfileModel.js";
import multer from "multer";
import FormData from "form-data";
import logger from "../config/logger.js";
const upload = multer(); // parses multipart form-data

const router = express.Router();

router.use(apiAuth);

// Pin file endpoint: checks capacity then updates volume
router.post("/pin", upload.single("file"), async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ username: req.apiUser.username });
    if (profile && profile.status === "hold") {
      return res.status(403).json({
        msg: "Your account is on hold.  Contact Smitty from your profile page.",
      });
    }
    const projectname = req.query.projectname || "";
    let name = req.apiUser.cidname + projectname + "-" + req.file.originalname;
    const pinResult = await pin(req.file);
    logger.info("Pin result:", pinResult);
    const addResult = await add(pinResult.Hash, name);
    res.status(200).json({
      msg: "File pinned successfully",
      IpfsHash: pinResult.Hash,
      pinRes: pinResult,
      addRes: addResult,
    });
  } catch (err) {
    logger.error("Error pinning file:", err);
    next(err);
  }
});

// Unpin endpoint: processes cids array and updates volume
router.post("/unpin", async (req, res, next) => {
  try {
    const { cids } = req.body;
    if (!cids || !Array.isArray(cids) || cids.length === 0) {
      return res.status(400).json({ msg: "Missing cids array" });
    }
    let totalUnpinnedSize = 0;
    for (const cid of cids) {
      const size = await sizeCID(cid);
      totalUnpinnedSize += Number(size);
    }
    await unpin(cids);
    const profile = await Profile.findOne({ username: req.apiUser.username });
    if (!profile) return res.status(404).json({ msg: "Profile not found" });
    profile.volume = Math.max(Number(profile.volume) - totalUnpinnedSize, 0);
    await profile.save();
    res.status(200).json({
      msg: "Files unpinned successfully",
      unpinnedSize: totalUnpinnedSize,
      newVolume: profile.volume,
    });
  } catch (err) {
    logger.error("Error in /unpin:", err);
    next(err);
  }
});

export default router;
