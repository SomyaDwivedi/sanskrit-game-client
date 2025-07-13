import React from "react";
import Logo from "../common/Logo";

interface HeaderProps {
  gameCode?: string;
  timer?: string;
}

const Header: React.FC<HeaderProps> = ({ gameCode, timer }) => {
  return (
    <header className="glass-card header-card p-4 mb-6 sticky top-0 z-50 backdrop-blur-md">
      <div className="container mx-auto flex justify-center items-center">
        <Logo />
      </div>
    </header>
  );
};

export default Header;
