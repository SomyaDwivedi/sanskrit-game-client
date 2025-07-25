import { Schema, model } from "mongoose";

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["Host", "Player"], required: true },
  createdAt: { type: Date, default: Date.now },
});

export default model("User", userSchema);
