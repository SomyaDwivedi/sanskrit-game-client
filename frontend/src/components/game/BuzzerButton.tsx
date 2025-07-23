import React from "react";

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled?: boolean;
  teamName?: string;
  loading?: boolean;
}

const BuzzerButton: React.FC<BuzzerButtonProps> = ({
  onBuzz,
  disabled = false,
  teamName,
  loading = false,
}) => {
  return (
    <div className="glass-card p-4 text-center">
      <h3 className="text-lg font-semibold mb-3 text-blue-300">
        🚀 Ready to answer?
      </h3>
      <button
        onClick={onBuzz}
        disabled={disabled || loading}
        className={`w-full text-xl font-bold py-6 px-8 rounded-xl transition-all transform ${
          !disabled && !loading
            ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer"
            : "bg-gray-600 cursor-not-allowed opacity-50"
        }`}
      >
        {loading ? (
          "🔄 BUZZING..."
        ) : (
          <>
            🔔 BUZZ IN!
            {teamName && (
              <div className="text-sm font-normal mt-1">For {teamName}</div>
            )}
          </>
        )}
      </button>
      <p className="text-xs text-blue-200 mt-2">First to buzz gets control!</p>
    </div>
  );
};

export default BuzzerButton;
