import express from "express";
import { getNodeStats } from "../utils/util.js";
const router = express.Router();

// Retrieve node stats and render the EJS view.
router.get("/", async (req, res) => {
  try {
    const nodeStats = await getNodeStats();
    res.render("nodeInfo.ejs", { nodeStats });
  } catch (err) {
    console.error("Error retrieving node stats:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

export default router;
