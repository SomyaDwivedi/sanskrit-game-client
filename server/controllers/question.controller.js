import { GameQuestion } from "../models/gameQuestion.model.js";
import * as questionService from "../services/questionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SCHEMA_MODELS } from "../utils/enums.js";

export const loadQuestions = asyncHandler(async (req, res) => {
  // Initial Step: Clean GameQuestion Schema

  // Step:1   Fetch all questions with admin-level details (including answers and timesSkipped)
  const questions = await questionService.getQuestions(
    SCHEMA_MODELS.FINALQUESTION
  );

  // Step:2  If no questions found, throw a 404 error
  if (questions.length === 0) {
    throw new ApiError(404, "No questions found");
  }

  // Step:3 Adding questions to game question schema (18 Input, 5 MCQ)
  await GameQuestion.insertMany(questions);

  // Step:4  Respond with success and the list of questions
  return res
    .status(200)
    .json(
      new ApiResponse(200, questions, "Questions Imported to Game Successfully")
    );
});
