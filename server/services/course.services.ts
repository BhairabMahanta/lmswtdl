import { Response } from "express";
import CourseModel from "../models/course.model";
export const createCourse = async (data: any, res: Response) => {
  try {
    const course = await CourseModel.create(data);
    res.status(201).json({
      success: true,
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
