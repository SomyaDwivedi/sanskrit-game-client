import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secretkey";

export const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, SECRET, { expiresIn: "2h" });
};
