import express from 'express';
import { activateAccount ,loginUser,logoutUser,registerUser, updateAccessToken } from '../controllers/user.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
const userRouter = express.Router();
userRouter.post('/register', registerUser);
userRouter.post('/activateAccount', activateAccount);
userRouter.post('/login', loginUser);
userRouter.post('/logout',isAuthenticated, logoutUser);
userRouter.post('/refreshToken', updateAccessToken);
export default userRouter;
//authorizeRoles("admin")