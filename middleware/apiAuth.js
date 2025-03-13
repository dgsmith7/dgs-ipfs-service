import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";

const apiAuth = async (req, res, next) => {
  const username = req.headers["x-api-username"];
  const apiKey = req.headers["x-api-key"];
  if (!username || !apiKey) {
    return res.status(401).json({ msg: "Missing API credentials" });
  }
  try {
    const user = await User.findOne({ username });
    if (!user || !user.apikey) {
      return res.status(401).json({ msg: "Invalid API credentials" });
    }
    if (!(await bcrypt.compare(apiKey, user.apikey))) {
      return res.status(401).json({ msg: "Invalid API credentials" });
    }
    req.apiUser = user;
    next();
  } catch (err) {
    console.error("API auth error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export default apiAuth;
