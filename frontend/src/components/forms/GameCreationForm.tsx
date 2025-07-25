import React from "react";
import { Link } from "react-router-dom";
import AnimatedCard from "../common/AnimatedCard";
import Button from "../common/Button";
import { ROUTES } from "../../utils/constants";

interface GameCreationFormProps {
  onCreateGame: () => void;
  isLoading: boolean;
}

const GameCreationForm: React.FC<GameCreationFormProps> = ({
  onCreateGame,
  isLoading,
}) => {
  return (
    <AnimatedCard>
      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-4 flex items-center justify-center text-white text-4xl">
              🎯
            </div>
            <p className="text-lg text-slate-300 mb-4">
              Ready to host a buzzer-based quiz competition?
            </p>
            <p className="text-slate-400">
              Click below to create a new game with Team Red vs Team Blue
            </p>
          </div>

          <Button
            onClick={onCreateGame}
            disabled={isLoading}
            variant="primary"
            size="xl"
            loading={isLoading}
            icon={!isLoading ? <span className="text-2xl">🚀</span> : undefined}
          >
            {isLoading ? "Creating..." : "CREATE GAME"}
          </Button>

          <div className="mt-6">
            <Link
              to={ROUTES.HOSTHOME}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
};

export default GameCreationForm;
