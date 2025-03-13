import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";

// Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  const apiKey = req.body.apikey;

  if (!apiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }

  // Retrieve API key from database (replace with your actual database logic)
  const keyList = await User.find({}, { apikey: 1, _id: 1 });
  console.log(keyList);
  let valid = false;
  let id = "";
  for (let i = 0; i < keyList.length; i++) {
    const match = await bcrypt.compare(apiKey, keyList[i].apikey);
    if (match) {
      valid = true;
      id = keyList[i]._id;
      break;
    }
  }
  if (valid) {
    console.log("Matched user id ", id);
    const user = await User.findOne({ _id: id });
    req.user = user;
    next();
  } else {
    return res.status(401).json({ message: "Invalid API key" });
  }
};

export { validateApiKey };
