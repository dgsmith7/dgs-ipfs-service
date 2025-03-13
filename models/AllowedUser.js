import mongoose from "mongoose";

const AllowedUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
});

export default mongoose.model("AllowedUser", AllowedUserSchema);
