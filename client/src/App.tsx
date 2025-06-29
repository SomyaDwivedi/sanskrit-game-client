import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.css";

// Import pages
import HomePage from "./pages/HomePage";
import JoinGamePage from "./pages/JoinGamePage";
import HostGamePage from "./pages/HostGamePage";

// Import constants
import { ROUTES } from "./utils/constants";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.HOST} element={<HostGamePage />} />
        <Route path={ROUTES.JOIN} element={<JoinGamePage />} />
      </Routes>
    </Router>
  );
};

export default App;
