import express from "express";
import {
  addAnswer,
  addQuestion,
  addReview,
  getAllCourses,
  getCourseForUser,
  getSingleCourse,
  updateCourse,
  uploadCourse,
} from "../controllers/course.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const courseRouter = express.Router();
courseRouter.post(
  "/uploadCourse",
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
courseRouter.put(
  "/updateCourse/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateCourse
);
courseRouter.get("/getSingleCourse/:id", getSingleCourse);
courseRouter.get("/getAllCourses", getAllCourses);
courseRouter.get("/getUserCourse/:id", isAuthenticated, getCourseForUser);
courseRouter.put("/addQuestion", isAuthenticated, addQuestion);
courseRouter.put("/addAnswer", isAuthenticated, addAnswer);
courseRouter.put("/addReview/:id", isAuthenticated, addReview);
export default courseRouter;
