import { Document, Model } from "mongoose";

interface MonthData {
  month: string;
  count: number;
}
interface IMonthlyAnalytics {
  month: string;
  count: number;
}

export async function getMonthlyAnalytics<T extends Document>(
  model: Model<T>
): Promise<{ lastTwelveMonths: IMonthlyAnalytics[] }> {
  const lastTwelveMonths: IMonthlyAnalytics[] = [];
  const date = new Date();
  date.setDate(date.getDate() + 1);
  for (let i = 0; i < 12; i++) {
    const firstDay = new Date(date.getFullYear(), date.getMonth() - i, 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() - i + 1, 0);
    const monthYear = lastDay.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    console.log("firstDay", firstDay);
    console.log("lastDay", lastDay);
    const count = await model.countDocuments({
      createdAt: {
        $gte: firstDay.toDateString(),
        $lte: lastDay.toDateString(),
      },
    });

    lastTwelveMonths.push({
      month: monthYear,
      count,
    });
  }
  return { lastTwelveMonths };
}
export async function getMonthlyAnalytics2<T extends Document>(
  model: Model<T>
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28
    );
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    const monthYear = endDate.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const count = await model.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    last12Months.push({ month: monthYear, count });
  }
  return { last12Months };
}
