import React from "react";

interface StatusIndicatorProps {
  type: "active" | "waiting" | "connected" | "team-status";
  label?: string;
  count?: number;
  maxCount?: number;
  isActive?: boolean;
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  type,
  label,
  count = 0,
  maxCount = 3,
  isActive = false,
  className = "",
}) => {
  if (type === "active") {
    return <div className={`team-active-indicator ${className}`}></div>;
  }

  if (type === "waiting") {
    return <div className={`team-waiting-indicator ${className}`}></div>;
  }

  if (type === "connected") {
    return <span className={`text-green-400 mr-2 ${className}`}>●</span>;
  }

  if (type === "team-status") {
    return (
      <span
        className={`px-3 py-1 rounded text-sm ${
          isActive ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
        } ${className}`}
      >
        {isActive ? "Your Turn" : "Waiting"}
      </span>
    );
  }

  return null;
};

export default StatusIndicator;