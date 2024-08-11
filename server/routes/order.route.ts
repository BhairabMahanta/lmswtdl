import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/createOrder", isAuthenticated, createOrder);
orderRouter.get(
  "/getAllOrders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);
export default orderRouter;
