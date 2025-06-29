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
    game: "h-screen flex flex-col gradient-bg overflow-hidden",
    fullscreen: "h-screen flex flex-col gradient-bg overflow-hidden",
  };

  const mainClasses = {
    default: "flex-1 container mx-auto px-4 py-8",
    game: "flex-1 flex gap-2 p-2 overflow-hidden",
    fullscreen: "flex-1 overflow-hidden",
  };

  return (
    <div className={`${layoutClasses[variant]} ${className}`}>
      <Header gameCode={gameCode} timer={timer} />

      <main className={mainClasses[variant]}>{children}</main>

      {variant === "default" && <Footer />}
    </div>
  );
};

export default PageLayout;
