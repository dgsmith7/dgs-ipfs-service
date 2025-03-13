import { getUserData } from "../models/UserDataModel.js";

const loadUserData = async (req, res, next) => {
  try {
    if (req.user && req.user.username) {
      req.userData = await getUserData(req.user.username);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default loadUserData;
