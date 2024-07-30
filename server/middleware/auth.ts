import {Request, Response, NextFunction} from 'express';
import jwt, { JwtPayload, TokenExpiredError } from 'jsonwebtoken';
import { CatchAsyncError } from './catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { redis } from '../utils/redis';
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    console.log("Cookies received:", req.cookies);

    const access_token = req.cookies.accessToken;
    
    if (!access_token) {
        console.log('Access token not found in cookies');
        return next(new ErrorHandler('Login first to access this resource', 400));
    }

    console.log('Access token found:', access_token);

    try {
        // Log the environment variable to check its content
        console.log('ACCESS_TOKEN env variable:', process.env.ACCESS_TOKEN);
        
        if (!process.env.ACCESS_TOKEN) {
            console.log('ACCESS_TOKEN environment variable is not set');
            return next(new ErrorHandler('Server configuration error', 500));
        }
  // Verify the token
  const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

  console.log("Decoded token:", decoded);

  if (!decoded) {
      return next(new ErrorHandler('Access token is invalid.', 400));
  }

  const user = await redis.get(decoded.id);

  console.log('User from Redis:', user);

  if (!user) {
      return next(new ErrorHandler('User not found', 404));
  }

  req.user = decoded;
  console.log("req.user:", req.user);
  next();
}catch (error: any) {
    if (error instanceof TokenExpiredError) {
        console.error("Token expired:", error);
        return res.status(401).json({
            success: false,
            message: 'Access token has expired. Please log in again to get a new token.',
        });
    } else {
        console.error("Error during token verification:", error);
        return res.status(401).json({
            success: false,
            message: 'Login first to access this resource',
            error: error.message,
        });
    }
}
});