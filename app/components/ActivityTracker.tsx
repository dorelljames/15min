"use client";

import { useEffect, useState } from "react";

import { Activity } from "../types";
import ReactMarkdown from "react-markdown";
import TimelineView from "./TimelineView";

// Interface for window.ai if it doesn't exist
declare global {
  interface Window {
    ai?: {
      canCreateGenericSession: () => Promise<
        "readily" | "after-download" | "no"
      >;
      createGenericSession: () => Promise<{
        prompt: (prompt: string) => Promise<string>;
        promptStreaming: (
          prompt: string
        ) => AsyncGenerator<string, void, unknown>;
        destroy: () => void;
      }>;
      summarizer?: {
        availability: () => Promise<
          "unavailable" | "downloadable" | "downloading" | "available"
        >;
        create: (options?: {
          sharedContext?: string;
          type?: "key-points" | "tl;dr" | "teaser" | "headline";
          format?: "markdown" | "plain-text";
          length?: "short" | "medium" | "long";
          monitor?: (m: EventTarget) => void;
        }) => Promise<{
          summarize: (
            text: string,
            options?: { context?: string }
          ) => Promise<string>;
          summarizeStreaming: (
            text: string,
            options?: { context?: string }
          ) => ReadableStream<string>;
          ready: Promise<void>;
        }>;
      };
    };
  }
}

export default function ActivityTracker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [summary, setSummary] = useState<{
    text: string;
    isAI: boolean;
  } | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  console.log("🚀 ~ ActivityTracker ~ isAIAvailable:", isAIAvailable);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const today = new Date();

  // Format date for display
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const month = today.toLocaleDateString("en-US", { month: "long" });
  const dayOfMonth = today.getDate();

  // Check for Summarizer API availability
  async function checkSummarizerAvailability() {
    try {
      console.log("Checking AI summarizer availability");

      // Check if the API is available
      if (
        "ai" in window &&
        window.ai &&
        "summarizer" in window.ai &&
        window.ai.summarizer
      ) {
        const availability = await window.ai.summarizer.availability();
        console.log("Summarizer availability:", availability);

        // Consider both fully available and downloadable/downloading as available
        setIsAIAvailable(availability === "available");

        // If it's downloading, we could potentially track progress here
        if (availability === "downloading" || availability === "downloadable") {
          setDownloadProgress(0);
        }
      } else if (window.ai?.canCreateGenericSession) {
        // Fall back to the generic session API if summarizer isn't available
        console.log("Falling back to generic session API");
        const result = await window.ai.canCreateGenericSession();
        console.log("canCreateGenericSession result:", result);
        setIsAIAvailable(result === "readily" || result === "after-download");
      } else {
        console.log("No AI API found");
        setIsAIAvailable(false);
      }
    } catch (error) {
      console.error("Error checking AI availability:", error);
      setIsAIAvailable(false);
    }
  }

  // Load activities from local storage on component mount
  useEffect(() => {
    const savedActivities = localStorage.getItem("activities");
    if (savedActivities) {
      try {
        // Parse the saved activities and convert string dates back to Date objects
        const parsedActivities = JSON.parse(savedActivities).map(
          (activity: any) => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
          })
        );
        setActivities(parsedActivities);
      } catch (error) {
        console.error("Failed to load activities:", error);
      }
    }
  }, []);

  // Save activities to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  // Add a new activity
  const handleAddActivity = (description: string, timeBlock: string) => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      description,
      timestamp: new Date(),
      completed: false, // We keep this property for backward compatibility
      timeBlock,
    };

    setActivities([...activities, newActivity]);
    setSummary(null); // Clear summary when a new activity is added
  };

  // Update an existing activity
  const handleUpdateActivity = (id: string, description: string) => {
    setActivities(
      activities.map((activity) =>
        activity.id === id ? { ...activity, description } : activity
      )
    );
    setSummary(null); // Clear summary when an activity is updated
  };

  // Delete an activity
  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((activity) => activity.id !== id));
    setSummary(null); // Clear summary when an activity is deleted
  };

  // This function is still needed for the TimelineView props
  const handleToggleActivity = (id: string) => {
    // We're not using this functionality anymore, but keeping it for interface compatibility
  };

  // Filter activities to show only today
  const todayActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.timestamp);
    return (
      activityDate.getDate() === today.getDate() &&
      activityDate.getMonth() === today.getMonth() &&
      activityDate.getFullYear() === today.getFullYear()
    );
  });

  // Generate summary using on-device AI
  const generateSummary = async () => {
    if (!todayActivities.length) return;

    setIsSummarizing(true);
    setSummary(null);

    const activitiesText = todayActivities
      .map((a) => `- ${a.description} (${a.timeBlock})`)
      .join("\n");

    try {
      // Try to use the Summarizer API first
      if (
        "ai" in window &&
        window.ai &&
        "summarizer" in window.ai &&
        window.ai.summarizer
      ) {
        // Initialize according to official pattern
        const availability = await window.ai.summarizer.availability();
        console.log("Summarizer availability:", availability);

        if (availability === "unavailable") {
          console.log("Summarizer API not available");
          setIsAIAvailable(false);
          return;
        }

        const options = {
          sharedContext: "Daily activities tracker",
          type: "key-points" as "key-points",
          format: "markdown" as "markdown",
          length: "medium" as "medium",
        };

        // Create the summarizer
        const summarizer = await window.ai.summarizer.create({
          ...options,
          monitor(m) {
            m.addEventListener("downloadprogress", (e: any) => {
              console.log(`Downloaded ${e.loaded * 100}%`);
              setDownloadProgress(e.loaded);
            });
          },
        });

        // If model needs to be downloaded, wait for it
        if (availability === "downloadable" || availability === "downloading") {
          console.log("Waiting for model to be ready...");
          await summarizer.ready;
        }

        // Generate the summary
        console.log("Generating summary with Summarizer API");
        const result = await summarizer.summarize(activitiesText, {
          context: "These are activities completed during the day.",
        });
        console.log("🚀 ~ generateSummary ~ result:", result);

        setSummary({ text: result, isAI: true });
      }
      // Fall back to the generic session API
      else if (window.ai?.createGenericSession) {
        console.log("Using generic session API for summary");
        const session = await window.ai.createGenericSession();
        const prompt = `Summarize the following activities for the day in one or two sentences:\n${activitiesText}`;
        const result = await session.prompt(prompt);
        setSummary({ text: result, isAI: true });
        session.destroy(); // Clean up the session
      }
      // No AI is available
      else {
        console.log("No AI APIs available");
        setIsAIAvailable(false);
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setIsAIAvailable(false);
    } finally {
      setIsSummarizing(false);
      setDownloadProgress(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 relative min-h-screen">
      {/* Date Header - Always at top */}
      <div className="mb-6 sticky top-0 bg-background/90 backdrop-blur-sm z-10 py-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xl text-foreground/80">
            {dayOfWeek} <span className="text-rose-500">{month}</span>
          </span>
          <span className="text-6xl font-light text-foreground">
            {dayOfMonth}
          </span>
        </div>
      </div>

      {/* Main content - Two columns on desktop, single column on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline View - Full width on mobile, left side on desktop */}
        <div className="lg:w-7/12 order-2 lg:order-1">
          <TimelineView
            activities={todayActivities}
            onToggleActivity={handleToggleActivity}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        </div>

        {/* Summary Section - Full width on mobile, right side on desktop, sticky on both */}
        <div className="lg:w-5/12 order-1 lg:order-2">
          <div className="sticky top-24 mt-4 p-8 border rounded-lg bg-secondary/30">
            <h2 className="text-lg font-semibold mb-2 text-foreground/90">
              Daily Summary
            </h2>
            {isAIAvailable === null ? (
              <p className="text-sm text-muted-foreground">
                Checking AI availability...
              </p>
            ) : isAIAvailable === false ? (
              <div>
                <p className="text-sm text-amber-600 mb-3">
                  Chrome AI is not available. To enable it:
                </p>
                <ol className="text-sm space-y-2 list-decimal pl-5 mb-3">
                  <li>Make sure you're using Chrome 131 or newer</li>
                  <li>
                    Open{" "}
                    <code className="px-1 py-0.5 bg-secondary/50 rounded">
                      chrome://flags/#summarization-api-for-gemini-nano
                    </code>
                  </li>
                  <li>Set it to "Enabled"</li>
                  <li>Restart Chrome</li>
                  <li>Refresh this page</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  This feature requires Chrome's on-device AI to generate
                  summaries of your activities.
                </p>
              </div>
            ) : (
              <>
                <button
                  onClick={generateSummary}
                  disabled={isSummarizing || !todayActivities.length}
                  className="mb-3 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSummarizing
                    ? downloadProgress !== null
                      ? `Downloading model (${Math.round(
                          downloadProgress * 100
                        )}%)`
                      : "Summarizing..."
                    : "Generate Summary"}
                </button>
                {isSummarizing ? (
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {downloadProgress !== null
                      ? "Downloading AI model..."
                      : "Generating summary..."}
                  </p>
                ) : summary ? (
                  <div className="text-foreground/80 max-h-[40vh] overflow-y-auto">
                    {summary.isAI ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{summary.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{summary.text}</p>
                    )}
                    {summary.isAI && (
                      <div className="mt-2 text-xs inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10 2C5.59 2 2 5.59 2 10C2 14.41 5.59 18 10 18C14.41 18 18 14.41 18 10C18 5.59 14.41 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16ZM13 6H9V11H13V6Z"></path>
                        </svg>
                        Generated by Chrome AI
                      </div>
                    )}
                  </div>
                ) : todayActivities.length > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Click the button to generate a summary of your day.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Add some activities to generate a summary.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
