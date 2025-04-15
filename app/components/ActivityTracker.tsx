"use client";

import { Activity, DailySummary } from "../types";
import { useEffect, useState } from "react";

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
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isAIAvailable, setIsAIAvailable] = useState<boolean | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [userName, setUserName] = useState("User");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");

  // Format date for display
  const dayOfWeek = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const month = selectedDate.toLocaleDateString("en-US", { month: "long" });
  const dayOfMonth = selectedDate.getDate();

  // Format date for storage and retrieval
  const formatDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  // Navigate to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

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

  // Effect to set isClient to true after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect to check AI availability only on the client after mount
  useEffect(() => {
    if (isClient) {
      checkSummarizerAvailability();

      // Load auto-refresh setting from localStorage
      const savedAutoRefresh = localStorage.getItem("autoRefresh");
      if (savedAutoRefresh !== null) {
        setAutoRefresh(savedAutoRefresh === "true");
      }

      // Load user name from localStorage
      const savedName = localStorage.getItem("userName");
      if (savedName) {
        setUserName(savedName);
      }
    }
  }, [isClient]);

  // Save auto-refresh setting to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("autoRefresh", autoRefresh.toString());
    }
  }, [autoRefresh, isClient]);

  // Save user name to localStorage when it changes
  useEffect(() => {
    if (isClient && userName !== "User") {
      localStorage.setItem("userName", userName);
    }
  }, [userName, isClient]);

  // Load activities and summaries from local storage on component mount
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

    // Load saved summaries
    const savedSummaries = localStorage.getItem("dailySummaries");
    if (savedSummaries) {
      try {
        const parsedSummaries = JSON.parse(savedSummaries);
        setDailySummaries(parsedSummaries);
      } catch (error) {
        console.error("Failed to load summaries:", error);
      }
    }
  }, []);

  // Save activities to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);

  // Save summaries to local storage whenever they change
  useEffect(() => {
    localStorage.setItem("dailySummaries", JSON.stringify(dailySummaries));
  }, [dailySummaries]);

  // Check for saved summary when date changes
  useEffect(() => {
    const dateKey = formatDateKey(selectedDate);
    const savedSummary = dailySummaries.find((ds) => ds.date === dateKey);

    if (savedSummary) {
      setSummary(savedSummary.summary);
    } else {
      setSummary(null);
    }
  }, [selectedDate, dailySummaries]);

  // Add a new activity
  const handleAddActivity = (description: string, timeBlock: string) => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      description,
      timestamp: new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        parseInt(timeBlock.split(":")[0]),
        parseInt(timeBlock.split(":")[1])
      ),
      completed: false, // We keep this property for backward compatibility
      timeBlock,
    };

    setActivities([...activities, newActivity]);
  };

  // Update an existing activity
  const handleUpdateActivity = (id: string, description: string) => {
    setActivities(
      activities.map((activity) =>
        activity.id === id ? { ...activity, description } : activity
      )
    );
  };

  // Delete an activity
  const handleDeleteActivity = (id: string) => {
    setActivities(activities.filter((activity) => activity.id !== id));
  };

  // This function is still needed for the TimelineView props
  const handleToggleActivity = (id: string) => {
    // We're not using this functionality anymore, but keeping it for interface compatibility
  };

  // Filter activities to show only for selected date
  const filteredActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.timestamp);
    return (
      activityDate.getDate() === selectedDate.getDate() &&
      activityDate.getMonth() === selectedDate.getMonth() &&
      activityDate.getFullYear() === selectedDate.getFullYear()
    );
  });

  // Generate summary using on-device AI
  const generateSummary = async () => {
    if (!isClient || !isAIAvailable) return;

    setIsSummarizing(true);
    setSummary(null);

    // Format activities with time information for better context
    const activitiesWithTime = filteredActivities
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((a) => {
        const time = a.timeBlock;
        return `- ${time}: ${a.description}`;
      })
      .join("\n");

    // Calculate total active hours
    const activeHours = calculateActiveHours(filteredActivities);

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

        // Create a better context for time analysis
        const timeContext = `
These are chronologically ordered activities completed during ${
          selectedDate.toLocaleDateString() === new Date().toLocaleDateString()
            ? "today"
            : `on ${month} ${dayOfMonth}`
        }. Total tracked time: approximately ${activeHours} hours.

Please analyze:
1. How the day was spent (time distribution)
2. Main focus areas or themes
3. Productive vs non-productive time
4. Any patterns worth noting
`;

        // Create the summarizer
        const monitor = (m: EventTarget) => {
          m.addEventListener("progress", (event: any) => {
            setDownloadProgress(event.detail.progress);
          });
          m.addEventListener("done", () => {
            setDownloadProgress(null);
            setIsAIAvailable(true);
          });
          m.addEventListener("error", (event: any) => {
            console.error("Model download error:", event.detail);
            setDownloadProgress(null);
            setIsAIAvailable(false);
          });
        };

        const summarizer = await window.ai.summarizer.create({
          monitor,
          type: "key-points",
          format: "markdown",
          length: "medium",
        });
        await summarizer.ready;

        // Generate the summary
        console.log("Generating summary with Summarizer API");
        const result = await summarizer.summarize(activitiesWithTime, {
          context: timeContext,
        });
        console.log("🚀 ~ generateSummary ~ result:", result);

        const newSummary = { text: result, isAI: true };
        setSummary(newSummary);

        // Save the summary for this date
        const dateKey = formatDateKey(selectedDate);
        const existingSummaryIndex = dailySummaries.findIndex(
          (ds) => ds.date === dateKey
        );

        if (existingSummaryIndex >= 0) {
          // Update existing summary
          const updatedSummaries = [...dailySummaries];
          updatedSummaries[existingSummaryIndex] = {
            date: dateKey,
            summary: newSummary,
          };
          setDailySummaries(updatedSummaries);
        } else {
          // Add new summary
          setDailySummaries([
            ...dailySummaries,
            {
              date: dateKey,
              summary: newSummary,
            },
          ]);
        }
      }
      // Fall back to the generic session API
      else if (window.ai?.createGenericSession) {
        console.log("Using generic session API for summary");
        const session = await window.ai.createGenericSession();

        const timeContext = `
Analyze these chronologically ordered activities for ${
          selectedDate.toLocaleDateString() === new Date().toLocaleDateString()
            ? "today"
            : `${month} ${dayOfMonth}`
        }. Total tracked time: approximately ${activeHours} hours.

${activitiesWithTime}

Please provide a detailed summary that includes:
1. How the day was spent (time distribution)
2. Main focus areas or themes
3. Productive vs non-productive time
4. Any patterns worth noting
5. Total active hours: ${activeHours}

Format your response with markdown headings and bullet points.`;

        const result = await session.prompt(timeContext);
        const newSummary = { text: result, isAI: true };
        setSummary(newSummary);

        // Save the summary for this date
        const dateKey = formatDateKey(selectedDate);
        const existingSummaryIndex = dailySummaries.findIndex(
          (ds) => ds.date === dateKey
        );

        if (existingSummaryIndex >= 0) {
          // Update existing summary
          const updatedSummaries = [...dailySummaries];
          updatedSummaries[existingSummaryIndex] = {
            date: dateKey,
            summary: newSummary,
          };
          setDailySummaries(updatedSummaries);
        } else {
          // Add new summary
          setDailySummaries([
            ...dailySummaries,
            {
              date: dateKey,
              summary: newSummary,
            },
          ]);
        }
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

  // Calculate approximate hours spent based on activities
  const calculateActiveHours = (activities: Activity[]) => {
    if (activities.length === 0) return 0;

    // Sort activities by time
    const sortedActivities = [...activities].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Calculate total time (estimate 15 minutes per activity if not specified)
    let totalHours = sortedActivities.length * 0.25;

    // If we have at least 2 activities, try to estimate based on time span
    if (sortedActivities.length >= 2) {
      const firstActivity = sortedActivities[0];
      const lastActivity = sortedActivities[sortedActivities.length - 1];

      // Calculate time difference in hours
      const timeDiff =
        (lastActivity.timestamp.getTime() - firstActivity.timestamp.getTime()) /
        (1000 * 60 * 60);

      // Use the larger value between time difference and activity count * 0.25
      totalHours = Math.max(timeDiff, totalHours);
    }

    return totalHours.toFixed(1);
  };

  // Effect to auto-refresh the summary on an interval when enabled
  useEffect(() => {
    if (!autoRefresh || !isClient || !isAIAvailable || isSummarizing) return;

    // Only auto-refresh when viewing today's activities
    const isToday =
      selectedDate.toLocaleDateString() === new Date().toLocaleDateString();
    if (!isToday) return;

    // Set up a 10-minute interval for refreshing
    const interval = setInterval(() => {
      if (filteredActivities.length > 0) {
        generateSummary();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, isClient, isAIAvailable, selectedDate, filteredActivities]);

  // Skeleton component for summary loading state
  const SummarySkeleton = () => (
    <div className="animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-secondary/50 rounded w-3/4 mb-3"></div>

      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-secondary/50 rounded w-full"></div>
        <div className="h-4 bg-secondary/50 rounded w-5/6"></div>
        <div className="h-4 bg-secondary/50 rounded w-4/5"></div>

        {/* Subtitle skeleton */}
        <div className="h-5 bg-secondary/40 rounded w-1/2 mt-5"></div>

        {/* List items skeleton */}
        <div className="pl-3 space-y-2 mt-3">
          <div className="h-3 bg-secondary/50 rounded w-full"></div>
          <div className="h-3 bg-secondary/50 rounded w-11/12"></div>
          <div className="h-3 bg-secondary/50 rounded w-4/5"></div>
        </div>

        {/* Another subtitle skeleton */}
        <div className="h-5 bg-secondary/40 rounded w-2/5 mt-4"></div>

        {/* More list items skeleton */}
        <div className="pl-3 space-y-2 mt-3">
          <div className="h-3 bg-secondary/50 rounded w-3/4"></div>
          <div className="h-3 bg-secondary/50 rounded w-full"></div>
        </div>
      </div>
    </div>
  );

  // Toggle auto-refresh function
  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev);
  };

  // Get appropriate greeting based on time of day
  const getGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      return "Good morning";
    } else if (currentHour >= 12 && currentHour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  };

  // Save user name and exit edit mode
  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
    }
    setIsEditingName(false);
  };

  // Handle edit name input key press
  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
      setTempName(userName);
    }
  };

  // Conditional rendering based on isClient
  if (!isClient) {
    // Render nothing or a placeholder during SSR and initial client render
    return null; // Or a loading skeleton
  }

  return (
    <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 relative min-h-screen flex flex-col">
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

        <div className="absolute left-1/2 transform -translate-x-1/2 text-rose-500 font-semibold text-lg">
          {isEditingName ? (
            <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-rose-200/30 animate-fadeIn">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleNameKeyPress}
                onBlur={handleSaveName}
                className="bg-transparent border-b border-rose-300 outline-none text-rose-500 px-1 w-40 text-center transition-all focus:border-rose-400"
                placeholder="Enter your name"
                autoFocus
                maxLength={20}
              />
              <button
                onClick={handleSaveName}
                className="ml-2 text-rose-400 hover:text-rose-600 transition-colors"
                title="Save name"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setIsEditingName(true);
                setTempName(userName);
              }}
              className="cursor-pointer group relative px-3 py-1.5 rounded-lg hover:bg-background/50 transition-all duration-300 hover:backdrop-blur-sm flex items-center"
              title="Click to edit your name"
            >
              <span className="relative">
                {getGreeting()},{" "}
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-500 inline-block">
                  {userName}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-rose-400 to-amber-400 group-hover:w-full transition-all duration-300"></span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1.5 opacity-0 group-hover:opacity-70 transition-opacity"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label="Previous day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-left"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm rounded bg-secondary/80 hover:bg-secondary/60 transition-colors"
          >
            Today
          </button>

          <button
            onClick={goToNextDay}
            className="p-2 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label="Next day"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-chevron-right"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content - Two columns on desktop, single column on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Timeline View - Full width on mobile, left side on desktop */}
        <div className="lg:w-7/12 order-2 lg:order-1">
          <TimelineView
            activities={filteredActivities}
            onToggleActivity={handleToggleActivity}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
          />
        </div>

        {/* Summary Section - Full width on mobile, right side on desktop, sticky on both */}
        <div className="lg:w-5/12 order-1 lg:order-2">
          <div className="sticky top-32 mt-4 p-8 border rounded-lg bg-secondary/30">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-foreground/90">
                {selectedDate.toLocaleDateString() ===
                new Date().toLocaleDateString()
                  ? "Today's Summary"
                  : `${month} ${dayOfMonth} Summary`}
              </h2>

              {isAIAvailable && (
                <div className="flex items-center gap-2">
                  {/* Auto-refresh toggle */}
                  {selectedDate.toLocaleDateString() ===
                    new Date().toLocaleDateString() && (
                    <button
                      onClick={toggleAutoRefresh}
                      className={`p-1.5 rounded-full transition-colors ${
                        autoRefresh
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                      }`}
                      title={
                        autoRefresh
                          ? "Auto-refresh enabled"
                          : "Enable auto-refresh"
                      }
                      aria-label={
                        autoRefresh
                          ? "Disable auto-refresh"
                          : "Enable auto-refresh"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                      </svg>
                    </button>
                  )}

                  {/* Generate summary button (now an icon) */}
                  <button
                    onClick={generateSummary}
                    disabled={isSummarizing || !filteredActivities.length}
                    className="p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Generate summary"
                    aria-label="Generate summary"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

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
                {isSummarizing ? (
                  <div className="min-h-[200px]">
                    {downloadProgress !== null ? (
                      <div className="flex flex-col items-center justify-center h-40 text-center">
                        <div className="w-20 h-20 rounded-full border-4 border-secondary border-t-primary animate-spin mb-3"></div>
                        <p className="text-sm text-muted-foreground">
                          Downloading AI model (
                          {Math.round(downloadProgress * 100)}%)
                        </p>
                      </div>
                    ) : (
                      <SummarySkeleton />
                    )}
                  </div>
                ) : summary ? (
                  <div className="text-foreground/80 max-h-[50vh] overflow-y-auto">
                    {summary.isAI ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          components={{
                            // Enhance headings with category colors
                            h1: ({ children }) => (
                              <h1 className="text-xl font-bold text-primary mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => {
                              const heading = children?.toString() || "";
                              let colorClass =
                                "text-blue-600 dark:text-blue-400";

                              // Add color coding for different categories
                              if (
                                heading
                                  .toLowerCase()
                                  .includes("time distribution")
                              ) {
                                colorClass =
                                  "text-indigo-600 dark:text-indigo-400";
                              } else if (
                                heading.toLowerCase().includes("focus") ||
                                heading.toLowerCase().includes("theme")
                              ) {
                                colorClass =
                                  "text-emerald-600 dark:text-emerald-400";
                              } else if (
                                heading.toLowerCase().includes("productive")
                              ) {
                                colorClass =
                                  "text-amber-600 dark:text-amber-400";
                              } else if (
                                heading.toLowerCase().includes("pattern")
                              ) {
                                colorClass =
                                  "text-fuchsia-600 dark:text-fuchsia-400";
                              }

                              return (
                                <h2
                                  className={`text-lg font-medium ${colorClass} border-b border-secondary/50 pb-1 pt-2`}
                                >
                                  {children}
                                </h2>
                              );
                            },
                            // Highlight key insights
                            strong: ({ children }) => (
                              <strong className="font-medium text-rose-600 dark:text-rose-400">
                                {children}
                              </strong>
                            ),
                            // Style lists for better readability
                            ul: ({ children }) => (
                              <ul className="pl-5 space-y-1 mt-2 mb-3 list-disc">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => (
                              <li className="text-foreground/90 ml-2 list-item">
                                {children}
                              </li>
                            ),
                          }}
                        >
                          {summary.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p>{summary.text}</p>
                    )}
                  </div>
                ) : filteredActivities.length > 0 ? (
                  <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                    <div className="text-muted-foreground mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mx-auto mb-2 opacity-50"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M7 8h10" />
                        <path d="M7 12h10" />
                        <path d="M7 16h10" />
                      </svg>
                      <p className="text-sm">
                        Click the analysis icon to generate your daily summary
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[200px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      {selectedDate.toLocaleDateString() ===
                      new Date().toLocaleDateString()
                        ? "Add some activities to generate a summary."
                        : `No activities found for ${month} ${dayOfMonth}. Add activities or select a different date.`}
                    </p>
                  </div>
                )}

                {/* Dedicated footer for summary metadata */}
                {summary && summary.isAI && (
                  <div className="pt-4 mt-4 border-t border-secondary/30">
                    <div className="flex flex-col xs:flex-row items-start xs:items-center xs:justify-between gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M10 2C5.59 2 2 5.59 2 10C2 14.41 5.59 18 10 18C14.41 18 18 14.41 18 10C18 5.59 14.41 2 10 2ZM10 16C6.69 16 4 13.31 4 10C4 6.69 6.69 4 10 4C13.31 4 16 6.69 16 10C16 13.31 13.31 16 10 16ZM13 6H9V11H13V6Z"></path>
                        </svg>
                        Generated with Chrome AI
                      </span>

                      {/* Saved summary indicator */}
                      {dailySummaries.some(
                        (ds) => ds.date === formatDateKey(selectedDate)
                      ) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-xs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Saved Summary
                        </span>
                      )}

                      {/* Auto-refresh indicator */}
                      {autoRefresh && (
                        <span className="text-xs flex items-center text-muted-foreground">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                          </svg>
                          Auto-refreshes every 10 minutes
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
