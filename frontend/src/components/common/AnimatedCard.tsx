import React from "react";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  delay = 0,
}) => (
  <div
    className={`animated-card ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

export default AnimatedCard;
