import express from 'express';
import { activateAccount ,loginUser,logoutUser,registerUser } from '../controllers/user.controller';
import { isAuthenticated } from '../middleware/auth';
const userRouter = express.Router();
userRouter.post('/register', registerUser);
userRouter.post('/activateAccount', activateAccount);
userRouter.post('/login', loginUser);
userRouter.post('/logout',isAuthenticated, logoutUser);
export default userRouter;