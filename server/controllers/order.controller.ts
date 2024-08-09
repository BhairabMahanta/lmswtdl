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
import { nayaOrder } from "../services/order.services";

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body as IOrder;

      console.log("Received Request Body:", req.body);
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      console.log("Fetched User:", user);

      const userCourseExist = user?.courses.some(
        (course: any) => course._id.toString() === courseId
      );
      console.log("Does User Already Own Course?:", userCourseExist);

      if (userCourseExist) {
        console.log("User already enrolled in the course:", courseId);
        return next(
          new ErrorHandler("You have already enrolled in this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId);
      console.log("Fetched Course:", course);

      if (!course) {
        console.log("Course not found:", courseId);
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
      console.log("Mail Data Prepared:", mailData);

      await ejs.renderFile(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );
      console.log("EJS Template Rendered Successfully");

      try {
        if (user) {
          console.log("Sending Email to:", user?.email);
          await sendEmail({
            email: user?.email,
            subject: "Order Confirmation",
            template: "order-confirmation",
            data: mailData,
          });
          console.log("Email Sent Successfully");
        }
      } catch (error: any) {
        console.error("Error Sending Email:", error.message);
        return next(new ErrorHandler(error.message, 500));
      }

      user?.courses.push(course?._id);
      console.log("Updated User Courses:", user?.courses);

      await user?.save();
      console.log("User Saved Successfully");

      const notification = await NotificationModel.create({
        user: req.user?.id,
        title: "New Order",
        message: `You have successfully enrolled in ${course.name}`,
      });
      console.log("Notification Created:", notification);

      await notification.save();
      console.log("Notification Saved Successfully");

      nayaOrder(data, res, next);
      console.log("Order Processing Completed Successfully");
    } catch (error: any) {
      console.error("Error Creating Order:", error.message);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);
