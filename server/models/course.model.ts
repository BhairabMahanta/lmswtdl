import mongoose, { Schema, Model, Document } from "mongoose";
interface IComment extends Document {
  user: string;
  question: string;
  questionReplies: IComment[];
  created: Date;
  updated: Date;
}

interface IReview extends Document {
  user: object;
  rating: number;
  comment: string;
  commentReplies: IComment[];
  created: Date;
  updated: Date;
}

interface ILink extends Document {
  title: string;
  url: string;
}

interface ICourseData extends Document {
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: string;
  videoPlayer: string;
  links: ILink[];
  suggestions: string;
  questions: IComment[];
}
interface ICourse extends Document {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  thumbNail: object;
  tags: string;
  level: string;
  demoURL: string;
  benefits: { title: string; description: string }[];
  preRequisites: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData;
  rating?: number;
  purchased?: number;
}

const reviewSchema = new Schema<IReview>({
  user: Object,
  rating: {
    type: Number,
    default: 0,
  },
  comment: String,
});
const linkSchema = new Schema<ILink>({
  title: String,
  url: String,
});
const commentSchema = new Schema<IComment>({
  user: String,
  question: String,
  questionReplies: [Object],
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});
const courseDataSchema = new Schema<ICourseData>({
  title: String,
  description: String,
  videoUrl: String,
  videoSection: String,
  videoLength: String,
  videoPlayer: String,
  links: [linkSchema],
  suggestions: String,
  questions: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: true,
  },
  description: { type: String, required: true },
  price: {
    type: Number,
    required: true,
  },
  originalPrice: { type: Number },
  thumbNail: {
    public_id: { type: String },
    url: { type: String },
  },
  tags: { type: String, required: true },
  level: { type: String, required: true },
  demoURL: { type: String, required: true },
  benefits: [{ title: String, description: String }],
  preRequisites: [{ title: String }],
  reviews: [reviewSchema],
  courseData: [courseDataSchema],
  rating: {
    type: Number,
    default: 0,
  },
  purchased: {
    type: Number,
    default: 0,
  },
});

const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);
export default CourseModel;
