"use client";

import { useEffect, useState } from "react";

type AIStatus =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "checking";

export default function ChromeAIStatusIndicator() {
  const [aiStatus, setAIStatus] = useState<AIStatus>("checking");
  const [isClient, setIsClient] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Check for AI availability on component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      checkAIAvailability();
    }
  }, [isClient]);

  async function checkAIAvailability() {
    try {
      // Check if the Chrome AI API is available
      if (
        "ai" in window &&
        window.ai &&
        "summarizer" in window.ai &&
        window.ai.summarizer
      ) {
        const availability = await window.ai.summarizer.availability();
        setAIStatus(availability);
      } else if (window.ai?.canCreateGenericSession) {
        const result = await window.ai.canCreateGenericSession();
        if (result === "readily") {
          setAIStatus("available");
        } else if (result === "after-download") {
          setAIStatus("downloadable");
        } else {
          setAIStatus("unavailable");
        }
      } else {
        setAIStatus("unavailable");
      }
    } catch (error) {
      console.error("Error checking AI availability:", error);
      setAIStatus("unavailable");
    }
  }

  function getStatusColor() {
    switch (aiStatus) {
      case "available":
        return "text-emerald-500";
      case "downloadable":
        return "text-amber-500";
      case "downloading":
        return "text-blue-500";
      case "unavailable":
        return "text-rose-500";
      default:
        return "text-gray-500";
    }
  }

  function getStatusText() {
    switch (aiStatus) {
      case "available":
        return "Chrome AI: Available";
      case "downloadable":
        return "Chrome AI: Ready to Download";
      case "downloading":
        return "Chrome AI: Downloading...";
      case "unavailable":
        return "Chrome AI: Unavailable";
      default:
        return "Chrome AI: Checking...";
    }
  }

  if (!isClient) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${getStatusColor()} border-current/30 text-xs`}
        aria-label={getStatusText()}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            aiStatus === "checking" ? "animate-pulse" : ""
          } ${getStatusColor()}`}
        ></span>
        <span>{getStatusText()}</span>
      </button>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-background border rounded-lg shadow-lg text-xs w-64 z-10">
          {aiStatus === "unavailable" && (
            <>
              <p className="font-medium mb-2">Chrome AI unavailable</p>
              <p className="mb-2">
                Chrome AI is not available for your browser. Please make sure
                you're using Chrome 131 or newer.
              </p>
              <button
                onClick={checkAIAvailability}
                className="mt-2 w-full bg-foreground/10 hover:bg-foreground/20 rounded px-2 py-1 transition-colors"
              >
                Check again
              </button>
            </>
          )}

          {aiStatus === "downloadable" && (
            <>
              <p className="font-medium mb-2">
                Chrome AI is ready to download!
              </p>
              <p className="mb-2">
                Go to the summary section and click "Download AI Model" to start
                the one-time download.
              </p>
            </>
          )}

          {aiStatus === "downloading" && (
            <>
              <p className="font-medium mb-2">Downloading Chrome AI Model</p>
              <p>Please keep the tab open until the download completes.</p>
            </>
          )}

          {aiStatus === "available" && (
            <>
              <p className="font-medium mb-2">Chrome AI is active!</p>
              <p>
                Generate AI summaries of your activities privately on your
                device.
              </p>
            </>
          )}

          {aiStatus === "checking" && <p>Checking Chrome AI availability...</p>}
        </div>
      )}
    </div>
  );
}
