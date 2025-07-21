import { GameQuestion } from "../models/gameQuestion.model.js";
import { ApiError } from "../utils/ApiError.js";
import { QUESTION_LEVEL, QUESTION_TYPE } from "../utils/constants.js";

async function getQuestions(collection) {
  // Fetch all questions with full details including answers and timesSkipped,
  // sorted by newest first

  const beginnerInputQuestions = await collection
    .find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.BEGINNER,
    })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: 1 })
    .limit(6);

  const intermediateInputQuestions = await collection
    .find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.INTERMEDIATE,
    })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: 1 })
    .limit(6);

  const advancedInputQuestions = await collection
    .find({
      questionType: QUESTION_TYPE.INPUT,
      used: { $ne: true },
      questionLevel: QUESTION_LEVEL.ADVANCED,
    })
    .select(
      "_id question questionCategory questionLevel questionType answers timestamps"
    )
    .sort({ createdAt: 1 })
    .limit(6);
  // const mcqQuestions = await collection
  //   .find({ questionType: QUESTION_TYPE.MCQ })
  //   .select(
  //     "_id question questionCategory questionLevel questionType answers timestamps"
  //   )
  //   .sort({ createdAt: -1 })
  //   .limit(5);

  const inputQuestions = [
    ...beginnerInputQuestions,
    ...intermediateInputQuestions,
    ...advancedInputQuestions,
  ];

  if (inputQuestions.length !== 18) {
    throw new ApiError(404, "Less than 18 questions in the DB. Game needs 18.");
  }

  return inputQuestions;
}

export { getQuestions };
