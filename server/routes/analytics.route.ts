import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  getCourseAnalytics,
  getUserAnalytics,
} from "../controllers/analytics.controller";
export const analyticsRouter = express.Router();
analyticsRouter.get(
  "/getUserAnalytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);
analyticsRouter.get(
  "/getCourseAnalytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCourseAnalytics
);
