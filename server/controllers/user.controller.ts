import {Request, Response, NextFunction} from 'express';
import userModel, { IUser } from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncError} from '../middleware/catchAsyncErrors';
import jwt, { Secret } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendEmail from '../utils/sendMail';
import { sendToken } from '../utils/jwt';
require ('dotenv').config();
//register
interface IRegistrationBody {
    name:   string;
    email:  string;
    password: string;
    avatar?:string;
}
export const registerUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
    const {name, email, password} = req.body;
    const existEmail = await userModel.findOne({email});
    if(existEmail) {
        return next(new ErrorHandler('Email already exists', 400));
    }
    const user:IRegistrationBody = {
        name,
        email,
        password
    };
    const activationToken = createActivationToken(user);

    const activationCode = activationToken.activationCode;
    const data = {user: {name: user.name}, activationCode};
    const html = await ejs.renderFile(path.join(__dirname, '../mails/activation-mail.ejs'), data);
    try{
        await sendEmail({
            email: user.email,
            subject: 'Account Activation',
            template: 'activation-mail.ejs',
            data,
        });
        res.status(201).json({
            success: true,
            message: `Please check your email: ${user.email} to activate your account`,
            activationToken: activationToken.token
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }

} catch (error:any) {
    next(new ErrorHandler(error.message, 400));
}
});
interface IactivationToken {
    token: string;
    activationCode: string;
}
export const createActivationToken = (user:any): IactivationToken => {
const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
const token = jwt.sign({user, activationCode}, process.env.ACTIVATION_SECRET as Secret, { 
    expiresIn: '5m'
});
return {token, activationCode};
};
interface IactivationRequest {
    activation_token: string;
    activation_code: string;
}
export const activateAccount = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {activation_token, activation_code} = req.body as IactivationRequest;
        const newUser: {user: IUser; activationCode: string} = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as Secret) as {user: IUser; activationCode: string};
       
        if(newUser.activationCode !== activation_code) {
            return next(new ErrorHandler('Invalid activation code', 400));
        }
        const {name, email, password} = newUser.user;
        const userExists = await userModel.findOne({email});
        if (userExists) {
            return next(new ErrorHandler('Email already exists', 400));
        } else {
            const user = await userModel.create({
                name,
                email,
                password
            });
        }
        res.status(201).json({
            success: true,
            message: 'Account activated successfully'
        });
    } catch (error:any) {
        next(new ErrorHandler(error.message, 400));
    }
});

// user logins
interface IloginRequest {
    email: string;
    password: string;
}
export const loginUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
        const {email, password} = req.body as IloginRequest;
        console.log(email, password);
        if(!email || !password) {
            return next(new ErrorHandler('Please enter email and password', 400));
        }
        const user = await userModel.findOne({email}).select('+password');
        if(!user) {
            return next(new ErrorHandler('Invalid email or password', 401));
        }
        const isPasswordMatched = await user.comparePassword(password);
        if(!isPasswordMatched) {
            return next(new ErrorHandler('Invalid email or password', 401));
        }
        sendToken(user, 200, res);
    } catch (error:any) {
        next(new ErrorHandler(error.message, 400));
    }
});

export const logoutUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try{
    res.cookie("access_token", "", {maxAge:1})
    res.cookie("refresh_token", "", {maxAge:1})
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
} catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
}
});