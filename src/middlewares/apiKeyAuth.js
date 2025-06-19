import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

const apiKeyAuth = async (req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key)
    return res.status(401).json({ status: "fail", message: "Missing API key" });

  const user = await User.findById(req.user._id).select("accessKey");

  console.log(user);
  if (!user)
    return res.status(403).json({ status: "fail", message: "Invalid API key" });

  const match = await bcrypt.compare(key, user.accessKey);
  if (!match)
    return res.status(403).json({ status: "fail", message: "Invalid API key" });

  req.user = user;
  next();
};

export default apiKeyAuth;
