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
export const sendToken = (user: IUser, statusCode: number, res: Response) => {
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    // upload the login session to redis
    redis.set(user._id, JSON.stringify(user as any));


    // parsing env  vars
    const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300', 10);
    const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '3540', 10);

    //cookie optiosn
    const accessTokenOptions: ITokenOptions = {
        expiresIn: new Date(Date.now() + accessTokenExpire * 1000),
        maxAge: accessTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
    const refreshTokenOptions: ITokenOptions = {
        expiresIn: new Date(Date.now() + refreshTokenExpire * 1000),
        maxAge: refreshTokenExpire * 1000,
        httpOnly: true,
        sameSite: 'lax'
    }
    if (process.env.NODE_ENV === 'production') {
        accessTokenOptions.secure = true;
        refreshTokenOptions.secure = true;
    }

    // set the cookies
    res.cookie('accessToken', accessToken, accessTokenOptions);
    res.cookie('refreshToken', refreshToken, refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        user,
        accessToken
    });
}