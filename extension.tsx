import "./app/globals.css";

import ActivityTracker from "./app/components/ActivityTracker";
import React from "react";
import { createRoot } from "react-dom/client";

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <ActivityTracker />
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
