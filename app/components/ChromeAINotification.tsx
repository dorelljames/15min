"use client";

import { useEffect, useState } from "react";

type AIStatus =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available"
  | "checking";

export default function ChromeAINotification() {
  const [aiStatus, setAIStatus] = useState<AIStatus>("checking");
  const [isClient, setIsClient] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check for AI availability on component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // Check if notification was previously dismissed
      const dismissed = localStorage.getItem("chromeAINotificationDismissed");
      if (dismissed) {
        setIsDismissed(true);
      }

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

        // If AI is fully available, automatically dismiss notification
        if (availability === "available") {
          setIsDismissed(true);
          localStorage.setItem("chromeAINotificationDismissed", "true");
        }
      } else if (window.ai?.canCreateGenericSession) {
        const result = await window.ai.canCreateGenericSession();
        if (result === "readily") {
          setAIStatus("available");
          setIsDismissed(true);
          localStorage.setItem("chromeAINotificationDismissed", "true");
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

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("chromeAINotificationDismissed", "true");
  };

  // Only show notification if AI is not available or needs downloading
  if (
    !isClient ||
    aiStatus === "available" ||
    aiStatus === "checking" ||
    isDismissed
  ) {
    return null;
  }

  const getBgColor = () => {
    switch (aiStatus) {
      case "downloadable":
        return "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
      case "downloading":
        return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
      default:
        return "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800";
    }
  };

  return (
    <div
      className={`fixed bottom-0 right-0 z-50 max-w-sm md:max-w-md m-4 p-4 rounded-lg shadow-lg border ${getBgColor()}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          {aiStatus === "unavailable" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-rose-500 mr-3 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          {aiStatus === "downloadable" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-amber-500 mr-3 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          )}
          {aiStatus === "downloading" && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500 mr-3 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
          )}

          <div>
            {aiStatus === "unavailable" && (
              <>
                <h3 className="font-medium text-rose-800 dark:text-rose-200">
                  Chrome AI not available
                </h3>
                <div className="mt-1 text-sm text-rose-700 dark:text-rose-300">
                  <p className="mb-2">
                    Chrome AI is not currently available in your browser.
                  </p>
                  <p className="mb-2">
                    Please make sure you're using Chrome version 131 or newer,
                    and try again.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={checkAIAvailability}
                      className="px-3 py-1 bg-rose-600 text-white text-sm rounded hover:bg-rose-700 transition-colors"
                    >
                      Check again
                    </button>
                  </div>
                </div>
              </>
            )}

            {aiStatus === "downloadable" && (
              <>
                <h3 className="font-medium text-amber-800 dark:text-amber-200">
                  Chrome AI ready to download
                </h3>
                <div className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                  <p className="mb-2">
                    The Chrome AI model is available for download. Go to the
                    summary section and click "Download AI Model" to get
                    started!
                  </p>
                  <p className="text-xs">
                    This is a one-time download of approximately 350MB. Your
                    data stays on your device.
                  </p>
                </div>
              </>
            )}

            {aiStatus === "downloading" && (
              <>
                <h3 className="font-medium text-blue-800 dark:text-blue-200">
                  Chrome AI downloading
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    The Chrome AI model is downloading. Please keep this tab
                    open until the download completes.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Dismiss notification"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
