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
  const [aiStatus, setAIStatus] = useState<
    "unavailable" | "downloadable" | "downloading" | "available" | "checking"
  >("checking");
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
      setAIStatus("checking");

      // Check if the API is available
      if (
        "ai" in window &&
        window.ai &&
        "summarizer" in window.ai &&
        window.ai.summarizer
      ) {
        const availability = await window.ai.summarizer.availability();
        console.log("Summarizer availability:", availability);

        setAIStatus(availability);

        // Only set AI as fully available if it's actually ready to use
        setIsAIAvailable(availability === "available");

        // If it's downloading or downloadable, set up download tracking
        if (availability === "downloading" || availability === "downloadable") {
          if (availability === "downloadable") {
            // Automatically start the download process
            try {
              setAIStatus("downloading");
              setDownloadProgress(0);

              // Create monitor to track download progress
              const monitor = new EventTarget();
              monitor.addEventListener("progress", (event: any) => {
                console.log("Download progress:", event.detail.progress);
                setDownloadProgress(event.detail.progress);
              });
              monitor.addEventListener("done", () => {
                console.log("Model download complete");
                setDownloadProgress(null);
                setIsAIAvailable(true);
                setAIStatus("available");
              });
              monitor.addEventListener("error", (event: any) => {
                console.error("Model download error:", event.detail);
                setDownloadProgress(null);
                setAIStatus("unavailable");
              });

              // Initialize the summarizer which triggers the download
              const summarizer = await window.ai.summarizer.create({
                monitor: monitor as unknown as (m: EventTarget) => void,
                type: "key-points",
                format: "markdown",
                length: "medium",
              });

              // Wait for the summarizer to be ready
              await summarizer.ready;
              setIsAIAvailable(true);
              setAIStatus("available");
            } catch (error) {
              console.error("Error initializing AI model:", error);
              setAIStatus("unavailable");
            }
          }
        }
      } else if (window.ai?.canCreateGenericSession) {
        // Fall back to the generic session API if summarizer isn't available
        console.log("Falling back to generic session API");
        const result = await window.ai.canCreateGenericSession();
        console.log("canCreateGenericSession result:", result);

        if (result === "readily") {
          setIsAIAvailable(true);
          setAIStatus("available");
        } else if (result === "after-download") {
          setAIStatus("downloadable");
          setDownloadProgress(0);

          // Automatically start the download process
          try {
            setAIStatus("downloading");

            // Initialize a session which should trigger the download
            const session = await window.ai!.createGenericSession();
            // If we got here, download succeeded
            setIsAIAvailable(true);
            setAIStatus("available");
            setDownloadProgress(null);

            // Clean up the test session
            session.destroy();
          } catch (error) {
            console.error("Error initializing generic AI session:", error);
            setAIStatus("unavailable");
          }
        } else {
          setIsAIAvailable(false);
          setAIStatus("unavailable");
        }
      } else {
        console.log("No AI API found");
        setIsAIAvailable(false);
        setAIStatus("unavailable");
      }
    } catch (error) {
      console.error("Error checking AI availability:", error);
      setIsAIAvailable(false);
      setAIStatus("unavailable");
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
        setAIStatus(availability);

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
        const monitor = new EventTarget();
        monitor.addEventListener("progress", (event: any) => {
          console.log("Progress event:", event.detail.progress);
          setDownloadProgress(event.detail.progress);
          setAIStatus("downloading");
        });
        monitor.addEventListener("done", () => {
          console.log("Model download complete");
          setDownloadProgress(null);
          setIsAIAvailable(true);
          setAIStatus("available");
        });
        monitor.addEventListener("error", (event: any) => {
          console.error("Model download error:", event.detail);
          setDownloadProgress(null);
          setIsAIAvailable(false);
          setAIStatus("unavailable");
        });

        const summarizer = await window.ai.summarizer.create({
          monitor: monitor as unknown as (m: EventTarget) => void,
          type: "key-points",
          format: "markdown",
          length: "medium",
        });

        try {
          await summarizer.ready;
          setAIStatus("available");

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
        } catch (error) {
          console.error("Error generating summary with summarizer:", error);
          // Try falling back to generic session
          await generateWithGenericSession();
        }
      }
      // Fall back to the generic session API
      else if (window.ai?.createGenericSession) {
        await generateWithGenericSession();
      }
      // No AI is available
      else {
        console.log("No AI APIs available");
        setIsAIAvailable(false);
        setAIStatus("unavailable");
      }
    } catch (error) {
      console.error("Error generating summary:", error);
      setIsAIAvailable(false);
      setAIStatus("unavailable");
    } finally {
      setIsSummarizing(false);
      if (downloadProgress === null) {
        setDownloadProgress(null);
      }
    }

    // Helper function for code reuse
    async function generateWithGenericSession() {
      console.log("Using generic session API for summary");
      try {
        const session = await window.ai!.createGenericSession();
        setAIStatus("available");

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
      } catch (error) {
        console.error("Error with generic session:", error);
        setIsAIAvailable(false);
        setAIStatus("unavailable");
      }
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

            {isAIAvailable === null || aiStatus === "checking" ? (
              <p className="text-sm text-muted-foreground">
                Checking AI availability...
              </p>
            ) : aiStatus === "unavailable" ? (
              <div>
                <p className="text-sm text-amber-600 mb-3">
                  Chrome AI is not available in your browser.
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Please make sure you're using Chrome version 131 or newer.
                </p>
                <button
                  onClick={checkSummarizerAvailability}
                  className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 transition-colors w-full mb-3"
                >
                  Check again
                </button>
                <p className="text-xs text-muted-foreground">
                  This feature uses Chrome's built-in Gemini Nano model for
                  private, on-device AI summaries without sending your data to
                  any servers.
                </p>
              </div>
            ) : aiStatus === "downloadable" ? (
              <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-amber-300 rounded-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-amber-500 mb-3"
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
                <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Chrome AI model ready to download
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  Download the AI model to generate private, on-device summaries
                  of your activities.
                </p>
                <button
                  onClick={checkSummarizerAvailability}
                  className="px-4 py-2 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 transition-colors shadow-sm mb-3"
                >
                  Download AI Model
                </button>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  This is a one-time download of approximately 350MB. Your data
                  stays on your device.
                </p>
              </div>
            ) : aiStatus === "downloading" ? (
              <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-blue-300 rounded-md">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-secondary border-t-blue-500 animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 font-bold text-lg">
                    {downloadProgress !== null
                      ? Math.round(downloadProgress * 100)
                      : 0}
                    %
                  </div>
                </div>
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Downloading Chrome AI model
                </h3>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-4">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${
                        downloadProgress !== null
                          ? Math.round(downloadProgress * 100)
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Please keep this tab open until the download completes.
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
