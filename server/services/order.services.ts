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
