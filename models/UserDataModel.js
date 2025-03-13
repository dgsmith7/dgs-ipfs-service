import { refreshAllPins, loadPinSizes, sizeCID } from "../utils/util.js";
import Profile from "../models/ProfileModel.js";
import User from "../models/UserModel.js";

let user, profile, allPins, userPins;

const initUserData = async (username) => {
  // Refresh user instance, profile and pins
  user = await User.findOne({ username });
  profile = await refreshProfile();
  allPins = await refreshAllPins();
  userPins = await refreshUserPins();
};

const refreshProfile = async () => {
  // Update the in-memory profile
  profile = await Profile.findOne({ username: user.username });
};

const refreshUserPins = async () => {
  // Use user.cidname to filter pins (update as needed in production)
  const ownerString = user.cidname;
  const refreshedPins = [];
  for (const item of allPins) {
    if (item.name.includes(ownerString)) {
      const size = await sizeCID(item.cid);
      refreshedPins.push({
        selected: false,
        cid: item.cid,
        name: item.name,
        size: size,
      });
    }
  }
  userPins = refreshedPins;
};

export async function getUserData(username) {
  try {
    const userInstance = await User.findOne({ username });
    const userProfile = await Profile.findOne({ username });
    const globalPins = await refreshAllPins();
    const ownerString = userInstance.cidname;
    const tempPins = [];
    for (const item of globalPins) {
      if (item.name.includes(ownerString)) {
        tempPins.push({ ...item });
      }
    }
    await loadPinSizes(tempPins);
    userPins = tempPins;
    // Sum sizes and update profile volume
    userProfile.volume = userPins.reduce(
      (sum, pin) => sum + Number(pin.size || 0),
      0
    );
    return {
      user: userInstance,
      profile: userProfile,
      allPins: globalPins,
      userPins,
    };
  } catch (err) {
    throw new Error("Error retrieving user data: " + err.message);
  }
}

export {
  initUserData,
  allPins,
  refreshAllPins,
  loadPinSizes,
  profile,
  refreshProfile,
  userPins,
  refreshUserPins,
};
