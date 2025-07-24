import User from "../data/User.js";
import { hash, compare } from "bcryptjs";
import { generateToken } from "../utils/jwt.js";

// ✅ DEFINE REGISTER FIRST
export const register = async (req, res) => {
  console.log("✅ REGISTER route hit", req.body);
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const passwordHash = await hash(password, 10);
    const newUser = new User({ username, passwordHash, role });
    const result = await newUser.save();
    console.log("✅ Saved to DB:", result);
    res.status(201).json({ message: "User created" });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.status(200).json({ token, role: user.role, username: user.username });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};
