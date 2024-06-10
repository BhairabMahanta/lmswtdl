import express from 'express';
import { activateAccount ,loginUser,registerUser } from '../controllers/user.controller';
const userRouter = express.Router();
userRouter.post('/register', registerUser);
userRouter.post('/activateAccount', activateAccount);
userRouter.post('/login', loginUser);
export default userRouter;