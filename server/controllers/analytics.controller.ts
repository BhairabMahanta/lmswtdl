import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { getMonthlyAnalytics } from "../utils/analytics";
import userModel from "../models/user.model";
import CourseModel from "../models/course.model";

export const getUserAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await getMonthlyAnalytics(userModel);

      const thang = await userModel.countDocuments({
        createdAt: {
          $gte: "2024-06-30T18:30:00.000Z",
          $lte: "2024-07-31T18:30:00.000Z",
        },
      });
      console.log("thanggg", thang);
      res.status(200).json({
        success: true,
        users,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCourseAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Assuming you're using find() and expecting an array of users
      const courses = await getMonthlyAnalytics(CourseModel);

      res.status(200).json({
        success: true,
        courses,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
