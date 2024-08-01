import express from "express";
import {
  activateAccount,
  getUserInfo,
  loginUser,
  logoutUser,
  registerUser,
  socialAuth,
  updateAccessToken,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();
userRouter.post("/register", registerUser);
userRouter.post("/activateAccount", activateAccount);
userRouter.post("/login", loginUser);
userRouter.post("/logout", isAuthenticated, logoutUser);
userRouter.get("/refreshToken", updateAccessToken);
userRouter.get("/userinfo", isAuthenticated, getUserInfo);
userRouter.post("/socialAuth", socialAuth);
userRouter.put("/updateUserInfo", isAuthenticated, updateUserInfo);
userRouter.put("/updatePassword", isAuthenticated, updatePassword);
userRouter.put("/updateProfile", isAuthenticated, updateProfilePicture);
export default userRouter;
//authorizeRoles("admin")
