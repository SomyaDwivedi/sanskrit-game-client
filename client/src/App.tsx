import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";

// Import pages
import HomePage from "./pages/HomePage";
import JoinPage from "./pages/JoinPage";
import HostPage from "./pages/HostPage";

// Import constants
import { ROUTES } from "./utils/constants";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.HOST} element={<HostPage />} />
        <Route path={ROUTES.JOIN} element={<JoinPage />} />
      </Routes>
    </Router>
  );
};

export default App;
