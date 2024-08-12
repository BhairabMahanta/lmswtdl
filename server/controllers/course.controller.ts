import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse, getAllCourseService } from "../services/course.services";
import CourseModel from "../models/course.model";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import path from "path";
import ejs from "ejs";
import sendEmail from "../utils/sendMail";
import { IUser } from "../models/user.model";
import NotificationModel from "../models/notification.model";

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
        await redis.set(courseId, JSON.stringify(course), "EX", 604800);
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
      if (!content) {
        return next(new ErrorHandler("Content not found", 404));
      }

      const newQuestion: any = {
        user: req.user?._id,
        question,
        questionReplies: [],
      };
      content.questions.push(newQuestion);
      const notification = await NotificationModel.create({
        user: req.user?._id,
        title: "New Question",
        message: `You have a new question in ${content.title}`,
      });

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

interface addAnswerData {
  questionId: string;
  answer: string;
  courseId: string;
  contentId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { questionId, answer, courseId, contentId } =
        req.body as addAnswerData;
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
      if (!content) {
        return next(new ErrorHandler("Content not found", 404));
      }
      const question = content.questions.find(
        (item: any) => item._id.toString() === questionId
      );
      if (!question) {
        return next(new ErrorHandler("Question not found", 404));
      }

      const newAnswer = {
        user: req.user,
        answer,
      };

      question.questionReplies.push(newAnswer);

      course?.save();
      if (req.user?._id === question.user._id) {
        // create notification model
        const notification = await NotificationModel.create({
          userId: req.user?._id,
          title: "New Reply received",
          message: `You a new reply in ${content.title}`,
        });
      } else {
        // create notification model
        const data = { name: req.user?.name, title: content.title };
        await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        try {
          await sendEmail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IaddReview {
  review: string;
  rating: number;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("req.body", req.body);
      const userCoursesList = req.user?.courses;
      const courseId = req.params.id;
      const courseThere = userCoursesList?.find(
        (course: any) => course._id.toString() === courseId.toString()
      );

      if (!courseThere) {
        return next(
          new ErrorHandler("You are not authorized to access this course", 401)
        );
      }
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const { review, rating } = req.body as IaddReview;
      const reviewData: any = {
        user: req.user,
        rating: rating,
        comment: review,
      };

      const isReviewed = course.reviews.find(
        (r: any) => r.user._id.toString() === req.user?._id.toString()
      );
      console.log("isReviewed", isReviewed);
      if (isReviewed) {
        course?.reviews.forEach((review: any) => {
          if (review.user._id.toString() === req.user?._id.toString()) {
            review.comment = reviewData.comment;
            review.rating = reviewData.rating;
          }
        });
      } else {
        course?.reviews.push(reviewData);
      }
      let avg = 0;
      course?.reviews.forEach((review: any) => {
        avg += review.rating;
      });
      if (course) {
        course.rating = avg / course?.reviews.length; // 4+5/2 = 4.5
      }
      await course?.save();
      res.status(200).json({
        success: true,
        course,
      });
      const notificationData = {
        title: course.name,
        message: `${req.user?.name} reviewed sum shit in ${course?.name}`,
      };
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IAddReviewData {
  comment: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course Not Found", 404));
      }
      const reviewIndex = course.reviews.findIndex(
        (rev: any) => rev._id.toString() === reviewId
      );
      console.log("Review Index:", reviewIndex);

      if (reviewIndex === undefined) {
        return next(new ErrorHandler("Review Not Found", 404));
      }
      const replyData: any = {
        user: req.user,
        comment: comment,
      };

      const review = course.reviews[reviewIndex];
      console.log("Review Before Push:", review);
      if (!review.commentReplies) {
        console.log("huh");
        review.commentReplies = [];
      }

      review.commentReplies.push(replyData);
      console.log("Review After Push:", review);
      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (error: any) {}
  }
);

export const getAllCoursesHaha = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCourseService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await CourseModel.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      await course.deleteOne({ id });
      await redis.del(id);
      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
