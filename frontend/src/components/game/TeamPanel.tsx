import React from "react";
import { Team } from "../../types";
import { getTeamColorClasses } from "../../utils/gameHelper";

interface QuestionStatus {
  firstAttemptCorrect: boolean | null; // true = correct, false = incorrect, null = not attempted
  pointsEarned: number;
}

interface RoundData {
  round1: QuestionStatus[];
  round2: QuestionStatus[];
  round3: QuestionStatus[];
}

interface TeamPanelProps {
  team: Team;
  teamIndex: number;
  isActive?: boolean;
  showMembers?: boolean;
  playerName?: string;
  isPlayerTeam?: boolean;
  currentRound?: number;
  roundScore?: number;
  questionsAnswered?: number;
  questionData?: RoundData; // NEW: Question status data
}

const TeamPanel: React.FC<TeamPanelProps> = ({
  team,
  teamIndex,
  isActive = false,
  showMembers = true,
  playerName,
  isPlayerTeam = false,
  currentRound = 1,
  roundScore = 0,
  questionsAnswered = 0,
  questionData = {
    round1: [
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 }
    ],
    round2: [
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 }
    ],
    round3: [
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 },
      { firstAttemptCorrect: null, pointsEarned: 0 }
    ]
  }
}) => {
  const colorClasses = getTeamColorClasses(teamIndex);

  // Get current round data
  const getCurrentRoundData = () => {
    switch (currentRound) {
      case 1: return questionData.round1;
      case 2: return questionData.round2;
      case 3: return questionData.round3;
      default: return questionData.round1;
    }
  };

  // Render question status (✓, ✗, or number)
  const renderQuestionStatus = (questionStatus: QuestionStatus, questionNumber: number, isCurrentRoundActive: boolean = false) => {
    let icon = "";
    let bgColor = "";
    let textColor = "";

    if (questionStatus.firstAttemptCorrect === true) {
      icon = "✓";
      bgColor = "bg-green-500";
      textColor = "text-white";
    } else if (questionStatus.firstAttemptCorrect === false) {
      icon = "✗";
      bgColor = "bg-red-500";
      textColor = "text-white";
    } else {
      icon = questionNumber.toString();
      if (isCurrentRoundActive && questionNumber === questionsAnswered + 1 && isActive) {
        bgColor = "bg-yellow-500";
        textColor = "text-black";
      } else {
        bgColor = "bg-gray-600";
        textColor = "text-gray-300";
      }
    }

    return (
      <div className="flex flex-col items-center">
        <div
          className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${bgColor} ${textColor} ${
            isCurrentRoundActive && questionNumber === questionsAnswered + 1 && isActive ? "animate-pulse" : ""
          }`}
        >
          {icon}
        </div>
        <div className="text-xs mt-1 font-semibold min-h-[14px]">
          <span className="text-green-300">{questionStatus.pointsEarned > 0 ? `+${questionStatus.pointsEarned}` : questionStatus.firstAttemptCorrect !== null ? "0" : ""}</span>
        </div>
      </div>
    );
  };

  // Render round summary
  const renderRoundSummary = (roundNum: number, roundData: QuestionStatus[]) => {
    const roundTotal = roundData.reduce((sum, q) => sum + q.pointsEarned, 0);
    
    return (
      <div className="glass-card p-2 mb-2 bg-gradient-to-r from-gray-600/20 to-gray-700/20 border-gray-500/30">
        <h5 className="text-xs font-bold text-gray-300 mb-1 text-center">
          Round {roundNum} Summary
        </h5>
        
        <div className="flex justify-center gap-1 mb-1">
          {roundData.map((questionStatus, idx) => 
            renderQuestionStatus(questionStatus, idx + 1, false)
          )}
        </div>

        <div className="text-center">
          <div className="text-sm font-bold text-gray-200">
            {roundTotal} pts
          </div>
        </div>
      </div>
    );
  };

  const currentRoundData = getCurrentRoundData();

  return (
    <div
      className={`glass-card p-3 h-full flex flex-col transition-all ${
        isActive ? `${colorClasses.ring} animate-pulse-slow` : ""
      } ${
        isPlayerTeam ? "border-yellow-400/50 bg-yellow-400/10" : ""
      }`}
    >
      {/* Team Name and Round Score (TOP) */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
          {team.name}
          {isPlayerTeam && <span className="text-yellow-400">👤</span>}
        </h3>
        {isPlayerTeam && playerName && (
          <div className="text-xs text-yellow-300 mb-2 font-medium">
            {playerName}
          </div>
        )}
        {/* Round Score at the TOP */}
        <div
          className={`text-2xl font-bold mb-1 animate-score ${colorClasses.primary}`}
        >
          {team.currentRoundScore || 0}
        </div>
        <div className="text-xs text-slate-400">Round {currentRound} Points</div>
      </div>

      {/* Team Members (only show if showMembers is true) */}
      {showMembers && team.members && team.members.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-slate-400 mb-2">
            Team Members
          </h4>
          <div className="space-y-1">
            {team.members
              .filter((member) => member.trim() !== "")
              .map((member, idx) => (
                <div
                  key={idx}
                  className="text-xs glass-card p-1 flex items-center gap-1"
                >
                  {idx === 0 && <span className="text-yellow-400">👑</span>}
                  {member}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Current Round Question Progress */}
      <div className="glass-card p-2 mb-3 bg-gradient-to-r from-red-600/20 to-red-700/20 border-red-500/30">
        <h4 className="text-sm font-bold text-red-300 mb-2 text-center">
          Round {currentRound}
        </h4>
        
        {/* Question Progress Indicators */}
        <div className="flex justify-center gap-1 mb-2">
          {currentRoundData.map((questionStatus, idx) => 
            renderQuestionStatus(questionStatus, idx + 1, true)
          )}
        </div>

        {/* Active Team Indicator */}
        {isActive && (
          <div className="text-center mb-2">
            <div className="text-xs bg-gray-800 px-2 py-1 rounded-lg border border-gray-600">
              <div className="text-gray-200 font-bold">🎯 YOUR TURN</div>
              <div className="text-gray-300 text-xs mt-1">Question {questionsAnswered + 1} of 3</div>
            </div>
          </div>
        )}
      </div>

      {/* Push content up and summaries to bottom */}
      <div className="flex-grow"></div>

      {/* Previous Round Summaries */}
      {currentRound >= 2 && (
        <div className="mb-3">
          {renderRoundSummary(1, questionData.round1)}
        </div>
      )}
      
      {currentRound >= 3 && (
        <div className="mb-3">
          {renderRoundSummary(2, questionData.round2)}
        </div>
      )}

      {/* Total Game Score Display (BOTTOM) */}
      <div className="bg-white text-black rounded px-2 py-1">
        <div className="text-xl font-bold">
          {team.score}
        </div>
        <div className="text-xs">Total Score</div>
      </div>
    </div>
  );
};

export default TeamPanel;