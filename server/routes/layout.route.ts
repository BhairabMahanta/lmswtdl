import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";
const layoutRouter = express.Router();

layoutRouter.post(
  "/createLayout",
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);

layoutRouter.put(
  "/editLayout",
  isAuthenticated,
  authorizeRoles("admin"),
  editLayout
);

layoutRouter.get("/getLayout/:type", getLayoutByType);

export default layoutRouter;
