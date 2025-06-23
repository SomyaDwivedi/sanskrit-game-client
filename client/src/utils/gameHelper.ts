
import { Game, Question, Team } from "../types";

// Generate random game code
export const generateGameCode = (): string => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

// Get current question from game
export const getCurrentQuestion = (game: Game | null): Question | null => {
  if (!game) return null;
  if (game.currentQuestionIndex < game.questions.length) {
    return game.questions[game.currentQuestionIndex];
  }
  return null;
};
// Format timer display
export const formatTimer = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Calculate game duration
export const calculateGameDuration = (startTime: number): string => {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  return formatTimer(elapsed);
};

// Get team by ID
export const getTeamById = (teams: Team[], teamId: string): Team | null => {
  return teams.find(team => team.id === teamId) || null;
};

// Get active team
export const getActiveTeam = (teams: Team[]): Team | null => {
  return teams.find(team => team.active) || null;
};

// Check if all answers are revealed
export const allAnswersRevealed = (question: Question): boolean => {
  return question.answers.every(answer => answer.revealed);
};

// Get total possible points for a question
export const getTotalPossiblePoints = (question: Question, round: number): number => {
  return question.answers.reduce((total, answer) => total + (answer.points * round), 0);
};

// Get revealed points for a question
export const getRevealedPoints = (question: Question, round: number): number => {
  return question.answers
    .filter(answer => answer.revealed)
    .reduce((total, answer) => total + (answer.points * round), 0);
};

// Determine game winner
export const getGameWinner = (teams: Team[]): Team => {
  return teams.reduce((winner, current) => 
    current.score > winner.score ? current : winner
  );
};

// Check if team has max strikes
export const hasMaxStrikes = (team: Team, maxStrikes: number = 3): boolean => {
  return team.strikes >= maxStrikes;
};

// Get team color classes
export const getTeamColorClasses = (teamIndex: number) => {
  const colors = [
    {
      primary: "text-orange-400",
      ring: "ring-orange-400", 
      bg: "bg-gradient-to-r from-orange-600/20 to-red-600/20",
      border: "border-orange-400/30"
    },
    {
      primary: "text-blue-400",
      ring: "ring-blue-400",
      bg: "bg-gradient-to-r from-blue-600/20 to-purple-600/20", 
      border: "border-blue-400/30"
    }
  ];
  
  return colors[teamIndex] || colors[0];
};

// Validate answer match
export const isAnswerMatch = (userAnswer: string, correctAnswer: string): boolean => {
  const normalizedUser = userAnswer.toLowerCase().trim();
  const normalizedCorrect = correctAnswer.toLowerCase();
  
  return (
    normalizedCorrect.includes(normalizedUser) ||
    normalizedUser.includes(normalizedCorrect)
  );
};

// Calculate points with round multiplier
export const calculatePoints = (basePoints: number, round: number): number => {
  return basePoints * round;
};

// Get next question index
export const getNextQuestionIndex = (currentIndex: number, totalQuestions: number): number => {
  return Math.min(currentIndex + 1, totalQuestions - 1);
};

// Check if game should end
export const shouldEndGame = (currentQuestionIndex: number, totalQuestions: number): boolean => {
  return currentQuestionIndex >= totalQuestions - 1;
};

// Get game statistics
export const getGameStats = (game: Game) => {
  const totalQuestions = game.questions.length;
  const totalStrikes = game.teams.reduce((sum, team) => sum + team.strikes, 0);
  const maxPoints = Math.max(...game.questions.flatMap(q => q.answers.map(a => a.points)));
  
  return {
    totalQuestions,
    totalStrikes,
    maxPoints,
    currentRound: game.currentRound,
    questionsCompleted: game.currentQuestionIndex,
  };
};