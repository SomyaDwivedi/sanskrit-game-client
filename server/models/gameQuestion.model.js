import mongoose, { Schema } from "mongoose";
import {
  QUESTION_CATEGORY,
  QUESTION_LEVEL,
  QUESTION_TYPE,
} from "../utils/constants.js";

const gameQuestionSchema = new Schema(
  {
    _id: { type: String },
    question: { type: String, required: true, trim: true },
    round: { type: Number },
    questionType: {
      type: String,
      enum: Object.values(QUESTION_TYPE),
      required: false,
    },
    questionCategory: {
      type: String,
      enum: Object.values(QUESTION_CATEGORY),
      required: false,
    },
    questionLevel: {
      type: String,
      enum: Object.values(QUESTION_LEVEL),
      required: false,
    },
    answers: [
      {
        _id: { type: String },
        answer: { type: String, required: false, trim: true },
        isCorrect: { type: Boolean, required: true, default: false },
        rank: { type: Number, required: false, min: 0, default: 0 },
        score: { type: Number, required: false, min: 0, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

export const GameQuestion = mongoose.model("GameQuestion", gameQuestionSchema);
