// Game utility functions

/**
 * Check if an answer matches the correct answer
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} - Whether the answers match
 */
function isAnswerMatch(userAnswer, correctAnswer) {
  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase();

  return (
    normalizedCorrect.includes(normalizedUser) ||
    normalizedUser.includes(normalizedCorrect)
  );
}

/**
 * Calculate points with round multiplier
 * @param {number} basePoints - Base points for the answer
 * @param {number} round - Current round number
 * @returns {number} - Total points awarded
 */
function calculatePoints(basePoints, round) {
  return basePoints * round;
}

/**
 * Check if all answers in a question are revealed
 * @param {Object} question - Question object
 * @returns {boolean} - Whether all answers are revealed
 */
function allAnswersRevealed(question) {
  return question.answers.every((answer) => answer.revealed);
}

/**
 * Get the team with the highest score
 * @param {Array} teams - Array of team objects
 * @returns {Object} - Winning team
 */
function getWinningTeam(teams) {
  return teams.reduce((winner, current) =>
    current.score > winner.score ? current : winner
  );
}

/**
 * Reset strikes for all teams
 * @param {Array} teams - Array of team objects
 */
function resetAllStrikes(teams) {
  teams.forEach((team) => {
    team.strikes = 0;
  });
}

/**
 * Switch active teams
 * @param {Array} teams - Array of team objects
 */
function switchActiveTeams(teams) {
  teams.forEach((team) => {
    team.active = !team.active;
  });
}

/**
 * Get active team
 * @param {Array} teams - Array of team objects
 * @returns {Object|null} - Active team or null
 */
function getActiveTeam(teams) {
  return teams.find((team) => team.active) || null;
}

/**
 * Validate game code format
 * @param {string} gameCode - Game code to validate
 * @returns {boolean} - Whether the game code is valid
 */
function isValidGameCode(gameCode) {
  return (
    typeof gameCode === "string" &&
    gameCode.length === 6 &&
    /^[A-Z0-9]+$/.test(gameCode)
  );
}

/**
 * Validate player name
 * @param {string} playerName - Player name to validate
 * @returns {boolean} - Whether the player name is valid
 */
function isValidPlayerName(playerName) {
  return (
    typeof playerName === "string" &&
    playerName.trim().length >= 2 &&
    playerName.trim().length <= 20
  );
}

/**
 * Get game progress percentage
 * @param {Object} game - Game object
 * @returns {number} - Progress percentage (0-100)
 */
function getGameProgress(game) {
  if (game.questions.length === 0) return 0;
  return Math.round((game.currentQuestionIndex / game.questions.length) * 100);
}

/**
 * Check if game should end (all questions completed)
 * @param {Object} game - Game object
 * @returns {boolean} - Whether the game should end
 */
function shouldEndGame(game) {
  return game.currentQuestionIndex >= game.questions.length;
}

module.exports = {
  isAnswerMatch,
  calculatePoints,
  allAnswersRevealed,
  getWinningTeam,
  resetAllStrikes,
  switchActiveTeams,
  getActiveTeam,
  isValidGameCode,
  isValidPlayerName,
  getGameProgress,
  shouldEndGame,
};
