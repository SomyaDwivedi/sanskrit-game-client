import mongoose, { Schema } from "mongoose";
import {
  QUESTION_CATEGORY,
  QUESTION_LEVEL,
  QUESTION_TYPE,
} from "../utils/constants.js";

const finalQuestionSchema = new Schema(
  {
    _id: { type: String },
    question: { type: String, required: true, trim: true },
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
    timesSkipped: { type: Number, required: false, min: 0, default: 0 },
    timesAnswered: { type: Number, required: false, min: 0, default: 0 },
    answers: [
      {
        _id: { type: String },
        answer: { type: String, required: false, trim: true },
        responseCount: { type: Number, required: false, min: 0, default: 0 },
        isCorrect: { type: Boolean, required: true, default: false },
        rank: { type: Number, required: false, min: 0, default: 0 },
        score: { type: Number, required: false, min: 0, default: 0 },
      },
    ],
    // set to True when question is used for Game
    // Set to False when in Dev Mode for Testing
    used: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const FinalQuestion = mongoose.model(
  "FinalQuestion",
  finalQuestionSchema
);
