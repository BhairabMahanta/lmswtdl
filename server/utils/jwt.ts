require(    'dotenv').config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
interface ITokenOptions {
    expiresIn: Date;
    maxAge: number;
    httpOnly: boolean;
    sameSite: 'lax' | 'strict' | 'none'| undefined;
    secure?: boolean;
}

export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '3540', 10);

//cookie optiosn
export const accessTokenOptions: ITokenOptions = {
    expiresIn: new Date(Date.now() + accessTokenExpire *60 * 60 * 1000),
    maxAge: accessTokenExpire * 60* 60*1000,
    httpOnly: true,
    sameSite: 'lax'
}
export const refreshTokenOptions: ITokenOptions = {
    expiresIn: new Date(Date.now() + refreshTokenExpire *24*60*60* 1000),
    maxAge: refreshTokenExpire *24*60*60* 1000,
    httpOnly: true,
    sameSite: 'lax'
}
export const sendToken =  (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.signAccessToken();
    console.log('accessToken', accessToken);
    const refreshToken = user.signRefreshToken();
    console.log('refreshToken', refreshToken);
    // upload the login session to redis
    redis.set(user._id, JSON.stringify(user as any));

    // parsing env  vars
   
    if (process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
        refreshTokenOptions.secure = true;
    }
        // set the cookies
        setTimeout(() => {
           
       
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);
    console.log('cookies set', res.cookie);
    console.log("accessToken", accessToken);
    console.log("refreshToken", refreshToken);
    console.log("user", user);
    console.log("accessTokenOptions:", accessTokenOptions)
    console.log("refreshTokenShit:", refreshTokenOptions)
        res.status(statusCode).json({
            success: true,
            user,
            accessToken
        });
    }, 1900);
    
}