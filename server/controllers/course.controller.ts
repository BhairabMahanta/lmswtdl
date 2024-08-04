import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.services";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const result = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "course_thumbnails",
        });
        data.thumbnail = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }
      createCourse(data, res);
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
export const updateCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);
        const result = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      }
      const courseId = req.params.id;
      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
//get single course

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const cacheThere = await redis.get(courseId);
      if (cacheThere) {
        const course = JSON.parse(cacheThere);
        return res.status(200).json({
          success: true,
          course: JSON.parse(course),
        });
      } else {
        const course = await CourseModel.findById(req.params.id).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        if (!course) {
          return next(new ErrorHandler("Course not found", 404));
        }
        await redis.set(courseId, JSON.stringify(course));
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cacheThere = await redis.get("courses");
      if (cacheThere) {
        const courses = JSON.parse(cacheThere);
        return res.status(200).json({
          success: true,
          courses: JSON.parse(courses),
        });
      } else {
        const courses = await CourseModel.find().select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        );
        res.status(200).json({
          success: true,
          courses,
        });
        await redis.set("courses", JSON.stringify(courses));
      }
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

//course content for paid users

export const getCourseForUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCoursesList = req.user?.courses;
      const courseId = req.params.id;
      const courseThere = userCoursesList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!courseThere) {
        return next(
          new ErrorHandler("You are not authorized to access this course", 401)
        );
      }
      const course = await CourseModel.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({
        success: true,
        content,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
interface addQuestion {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("gae");
      const { question, courseId, contentId } = req.body as addQuestion;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }
      const content = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      console.log("content", content);
      if (!content) {
        return next(new ErrorHandler("Content not found", 404));
      }
      const newQuestion: any = {
        user: req.user?._id,
        question,
        questionReplies: [],
      };
      console.log("newQuestion", newQuestion);
      content.questions.push({ newQuestion });
      await course.save();
      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
