import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import OrderModel from "../models/order.model";

export const nayaOrder = CatchAsyncError(
  async (data: any, res: Response, next: NextFunction) => {
    try {
      const order = await OrderModel.create(data);
      res.status(200).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    } catch (error: any) {
      return next(new Error(error.message));
    }
  }
);

// get all orders
export const getAllOrderService = async (res: Response) => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
