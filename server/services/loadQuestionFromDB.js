import { FinalQuestion } from "../models/finalQuestion.model.js";
import { GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { SCHEMA_MODELS } from "../utils/enums.js";
import { getQuestions } from "./questionService.js";

export async function prepareGameQuestions() {
  const questions = await getQuestions(SCHEMA_MODELS.FINALQUESTION);

  console.log("Questions: ", questions);

  if (!questions.length) {
    throw new ApiError(
      500,
      "No New questions found to load into game. All The questions were used in previous Game."
    );
  }

  // Step 2: Extract all valid questionIDs
  const questionIDs = questions
    .map((q) => q._id)
    .filter((id) => typeof id === "string" && id.trim() !== "");

  if (questionIDs.length === 0) {
    throw new ApiError(400, "No valid Question IDs provided.");
  }

  // Clear old ones before inserting
  await GameQuestion.deleteMany();
  await GameQuestion.insertMany(questions);
  // await FinalQuestion.updateMany(
  // { _id: { $in: questionIDs } }
  // { $set: { used: true } }
  // );
  return questions;
}
