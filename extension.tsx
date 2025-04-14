import "./app/globals.css";

import ActivityTracker from "./app/components/ActivityTracker";
import React from "react";
import { ThemeProvider } from "./app/components/ThemeProvider";
import ThemeSwitcher from "./app/components/ThemeSwitcher";
import { createRoot } from "react-dom/client";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeSwitcher />
        </div>
        <ActivityTracker />
      </div>
    </ThemeProvider>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}
