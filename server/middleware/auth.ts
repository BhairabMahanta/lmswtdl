import {Request, Response, NextFunction} from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { CatchAsyncError } from './catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { redis } from '../utils/redis';
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.cookies);
    const access_token = req.cookies.accessToken;
      if(access_token === undefined) {
        return next(new ErrorHandler('Login first to access this resource', 400));
    }
    console.log('smth')
    try {
        console.log('smth:', process.env.ACCESS_TOKEN)
        const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
        console.log(decoded);
        if (!decoded) {
            return next(new ErrorHandler('Access token is invalid.', 400));
        }
        const user = await redis.get(decoded.id);
        if (!user) {
            return next(new ErrorHandler('User not found', 404));
        }
        req.user = decoded;
        console.log(req.user);
        next();
    } catch (error:any) {
        return res.status(401).json({
            success: false,
            message: 'Login first to access this resourcese'
        });
    }
});