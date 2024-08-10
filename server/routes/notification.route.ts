import express from "express";
import {
  getNotification,
  updateNotification,
} from "../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const notificationRouter = express.Router();
notificationRouter.get(
  "/getAllNotifications",
  isAuthenticated,
  authorizeRoles("admin"),
  getNotification
);

notificationRouter.get(
  "/updateNotification/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotification
);
export default notificationRouter;
