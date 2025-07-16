

import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface PageLayoutProps {
  children: React.ReactNode;
  gameCode?: string;
  timer?: string;
  variant?: "default" | "game" | "fullscreen";
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  gameCode,
  timer,
  variant = "default",
  className = "",
}) => {
  const layoutClasses = {
    default: "min-h-screen flex flex-col gradient-bg",
    game: "h-screen flex flex-col gradient-bg game-bg overflow-hidden",
    fullscreen: "h-screen flex flex-col gradient-bg overflow-hidden", // Updated this line
  };

  const mainClasses = {
    default: "flex-1 container mx-auto px-4 py-8",
    game: "flex-1 flex gap-2 p-2 overflow-hidden",
    fullscreen: "flex-1 relative overflow-hidden", // Updated this line
  };

  return (
    <div className={`${layoutClasses[variant]} ${className}`}>
      {/* Only show header if not fullscreen variant */}
      {variant !== "fullscreen" && <Header gameCode={gameCode} timer={timer} />}

      <main className={mainClasses[variant]}>{children}</main>

      {variant === "default" && <Footer />}
    </div>
  );
};

export default PageLayout;
