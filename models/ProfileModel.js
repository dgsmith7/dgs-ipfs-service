import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ["hold", "free"],
    default: "free",
    required: true,
  },
  holddates: { type: [Date], required: true },
  holdreasons: { type: [String], required: true },
  started: { type: Date, required: true },
  lastlogin: { type: Date, required: true },
  volume: { type: Number, required: true },
  capacity: { type: Number, required: true },
});

export default mongoose.model("Profile", ProfileSchema);
