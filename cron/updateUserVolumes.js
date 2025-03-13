import Profile from "../models/ProfileModel.js";
import User from "../models/UserModel.js";
import { refreshAllPins, sizeCID } from "../utils/util.js";

export async function updateUserVolumes() {
  try {
    // Retrieve all global pins from IPFS
    const globalPins = await refreshAllPins();
    const profiles = await Profile.find();
    for (const profile of profiles) {
      // Get the corresponding user to find the owner's cidname
      const user = await User.findOne({ username: profile.username });
      if (!user || !user.cidname) continue;
      const ownerString = user.cidname;
      // Filter global pins to just those for this user
      const userPins = globalPins.filter((pin) =>
        pin.name.includes(ownerString)
      );
      let totalVolume = 0;
      // Sum up sizes using sizeCID for each of the user pins
      for (const pin of userPins) {
        // Size now returned in KB
        const size = await sizeCID(pin.cid);
        totalVolume += Number(size);
      }
      profile.volume = totalVolume;
      // Compare total volume (in KB) against capacity converted to KB using multiplier 1000
      if (totalVolume > profile.capacity * 1000) {
        profile.status = "hold";
        const now = new Date();
        profile.holddates = profile.holddates || [];
        profile.holdreasons = profile.holdreasons || [];
        profile.holddates.push(now);
        profile.holdreasons.push("over limit");
      } else {
        profile.status = "free";
      }
      await profile.save();
    }
    console.log("User volume update complete.");
  } catch (err) {
    console.error("Error updating user volumes:", err);
  }
}
