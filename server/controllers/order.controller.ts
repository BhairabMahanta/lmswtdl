import { NextFunction, Response, Request } from "express";
import OrderModel, { IOrder } from "../models/order.model";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";
import path from "path";
import ejs from "ejs";
import fs from "fs";
import sendEmail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { getAllOrderService, nayaOrder } from "../services/order.services";

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body as IOrder;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      const userCourseExist = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );

      if (userCourseExist) {
        return next(
          new ErrorHandler("You have already enrolled in this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      const data: any = {
        courseId: course._id.toString(),
        userId: req.user?._id,
        paymentInfo,
      };
      console.log("Order Data Prepared:", data);

      const mailData: any = {
        order: {
          _id: course?._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour12: true,
          }),
        },
      };

      await ejs.renderFile(
        path.join(__dirname, "../mails/orderConfirmationbs.ejs"),
        { order: mailData }
      );

      try {
        if (user) {
          console.log("Sending Email to:", user?.email);
          await sendEmail({
            email: user?.email,
            subject: "Order Confirmation",
            template: "orderConfirmationbs.ejs",
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      user?.courses.push(course?._id);

      await user?.save();

      const notification = await NotificationModel.create({
        userId: req.user?._id,
        title: "New Order",
        message: `You have successfully enrolled in ${course.name}`,
      });

      await notification.save();
      console.log("hmm");
      if (course.purchased !== undefined) {
        console.log("Course Purchased:", course.purchased);
        course.purchased += 1;
        console.log("Course Purchased:", course.purchased);
      }
      console.log("hmm");
      await course?.save();
      nayaOrder(data, res, next);
    } catch (error: any) {
      console.error("Error Creating Order:", error.message);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrderService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
