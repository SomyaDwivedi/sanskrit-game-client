import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";

// Import pages
import HomePage from "./pages/HomePage.tsx";
import JoinPage from "./pages/JoinPage.tsx";
import HostPage from "./pages/HostPage.tsx";

// Import constants
import { ROUTES } from "./utils/constants.ts";

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