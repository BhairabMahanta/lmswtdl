import {Request, Response, NextFunction} from 'express';
import userModel from '../models/user.model';
import ErrorHandler from '../utils/ErrorHandler';
import {CatchAsyncError} from '../middleware/catchAsyncErrors';
import jwt, { Secret } from 'jsonwebtoken';
import ejs from 'ejs';
import path from 'path';
import sendEmail from '../utils/sendMail';
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
        return next(new ErrorHandler(error.message, 500));
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
    expiresIn: '6m'
});
return {token, activationCode};
}