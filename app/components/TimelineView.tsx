"use client";

import { useEffect, useRef, useState } from "react";

import { Activity } from "../types";
import TimeIndicator from "./TimeIndicator";

interface TimelineViewProps {
  activities: Activity[];
  onToggleActivity: (id: string) => void;
  onAddActivity: (description: string, timeBlock: string) => void;
  onUpdateActivity?: (id: string, description: string) => void;
  onDeleteActivity: (id: string) => void;
}

export default function TimelineView({
  activities,
  onToggleActivity,
  onAddActivity,
  onUpdateActivity = (id, description) => {}, // Default empty function
  onDeleteActivity,
}: TimelineViewProps) {
  const [newActivity, setNewActivity] = useState("");
  const [editingTimeBlock, setEditingTimeBlock] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivityId, setDeletingActivityId] = useState<string | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const timelineContainerRef = useRef<HTMLDivElement>(null); // Ref for the timeline container

  useEffect(() => {
    // Update current time every second
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // 1 second interval for more accurate time display

    // Clear interval on component unmount
    return () => clearInterval(timerId);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Twitter-length character limit
  const MAX_CHARS = 280;

  // Generate time blocks starting from 5 AM and wrapping around
  const startHour = 5; // Start at 5 AM
  const hours = 24; // Still show 24 hours
  const timeBlocks = Array.from({ length: hours * 4 }, (_, i) => {
    // Calculate hour with wraparound (5, 6, ..., 23, 0, 1, 2, 3, 4)
    const hour = (Math.floor(i / 4) + startHour) % 24;
    const minute = (i % 4) * 15;
    // Adjust hour for 12 AM/PM display
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return {
      time: `${hour}:${minute.toString().padStart(2, "0")}`,
      display: `${displayHour}:${minute.toString().padStart(2, "0")}`,
      hour12: `${displayHour}:${minute.toString().padStart(2, "0")}`, // Use displayHour
      ampm: hour < 12 ? "AM" : "PM", // 0-11 is AM, 12-23 is PM
      fulltime: `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
      isFirstOfHour: minute === 0,
    };
  });

  // Group activities by timeBlock
  const activityByTimeBlock: Record<string, Activity[]> = {};
  activities.forEach((activity) => {
    if (!activityByTimeBlock[activity.timeBlock]) {
      activityByTimeBlock[activity.timeBlock] = [];
    }
    activityByTimeBlock[activity.timeBlock].push(activity);
  });

  // Handle adding a new activity
  const handleAddActivity = (timeBlock: string) => {
    if (newActivity.trim()) {
      onAddActivity(newActivity.trim(), timeBlock);
      setNewActivity("");
      setEditingTimeBlock(null);
    }
  };

  // Handle updating an existing activity
  const handleUpdateActivity = () => {
    if (editingActivity && newActivity.trim()) {
      onUpdateActivity(editingActivity.id, newActivity.trim());
      setNewActivity("");
      setEditingActivity(null);
    }
  };

  // Handle input change with character limit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= MAX_CHARS) {
      setNewActivity(e.target.value);
    }
  };

  // Calculate current time position using percentage of container height
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const totalMinutesInDay = 24 * 60;
  const minutesPassed = currentHour * 60 + currentMinute;
  const percentageOfDayPassed = (minutesPassed / totalMinutesInDay) * 100;

  // Calculate the current 15-minute interval progress
  const minuteBlock = Math.floor(currentMinute / 15) * 15;
  const currentTimeBlock = `${currentHour
    .toString()
    .padStart(2, "0")}:${minuteBlock.toString().padStart(2, "0")}`;
  const minutesIntoCurrentBlock = currentMinute % 15;
  const progressInCurrentBlock = (minutesIntoCurrentBlock / 15) * 100;

  // Calculate the offset based on the container's scroll height
  let currentTimeTopOffset = 0;
  if (timelineContainerRef.current) {
    // Calculate offset relative to the scrollable height
    currentTimeTopOffset =
      (percentageOfDayPassed / 100) * timelineContainerRef.current.scrollHeight;
  }

  // Format current time for display in AM/PM format to match the app's time display
  const displayHour =
    currentTime.getHours() === 0
      ? 12
      : currentTime.getHours() > 12
      ? currentTime.getHours() - 12
      : currentTime.getHours();
  const ampm = currentTime.getHours() < 12 ? "AM" : "PM";
  const formattedCurrentTime = `${displayHour}:${currentTime
    .getMinutes()
    .toString()
    .padStart(2, "0")} ${ampm}`;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        {/* Left timeline with vertical line */}
        <div className="absolute left-20 top-0 bottom-0 w-[1px] bg-border"></div>

        <div ref={timelineContainerRef}>
          {" "}
          {/* Add ref here */}
          {timeBlocks.map((block, index) => {
            // Find activities for this time block
            const blockActivities = activityByTimeBlock[block.fulltime] || [];
            const hasActivities = blockActivities.length > 0;

            return (
              <div key={block.fulltime} className="relative">
                {/* Add hour marker and time label */}
                {block.isFirstOfHour && (
                  <div
                    id={`hour-${Math.floor(index / 4)}`}
                    className="h-10 flex items-center"
                  >
                    <div className="w-20 text-right pr-4">
                      <div className="text-muted-foreground text-sm">
                        {block.hour12}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {block.ampm}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex h-12">
                  {/* Time column spacer */}
                  <div className="w-20"></div>
                  {/* Timeline dot */}
                  <div className="w-[2px] self-stretch relative">
                    <div
                      className={`absolute w-[6px] h-[6px] rounded-full bg-background border-2 ${
                        hasActivities ? "border-rose-300" : "border-border"
                      } left-[-2.5px] top-[calc(50%-3px)]`}
                    ></div>
                  </div>
                  {/* Activity card area with consistent height */}
                  <div className="flex-1 pl-5 flex items-center">
                    <div className="w-full">
                      {hasActivities ? (
                        <div className="border-b border-border py-2 px-1 min-h-8 relative">
                          {/* Progress bar for current time block */}
                          {block.fulltime === currentTimeBlock && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gray-100 w-full rounded-sm">
                              <div
                                className="absolute h-full bg-rose-200 rounded-sm transition-all duration-300 ease-in-out"
                                style={{ width: `${progressInCurrentBlock}%` }}
                              >
                                <TimeIndicator time={formattedCurrentTime} />
                              </div>
                            </div>
                          )}
                          {blockActivities.map((activity) =>
                            editingActivity?.id === activity.id ? (
                              <div
                                key={activity.id}
                                className="flex items-center"
                              >
                                <input
                                  type="text"
                                  value={newActivity}
                                  onChange={handleInputChange}
                                  className="flex-1 bg-transparent border-none outline-none text-foreground py-1"
                                  maxLength={MAX_CHARS}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateActivity();
                                    } else if (e.key === "Escape") {
                                      setEditingActivity(null);
                                      setNewActivity("");
                                    }
                                  }}
                                  onBlur={() => {
                                    if (newActivity.trim()) {
                                      handleUpdateActivity();
                                    } else {
                                      setEditingActivity(null);
                                      setNewActivity("");
                                    }
                                  }}
                                />
                                <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                                  {newActivity.length}/{MAX_CHARS}
                                </div>
                              </div>
                            ) : (
                              <div
                                key={activity.id}
                                className="py-1 text-foreground hover:bg-secondary/20 rounded px-1 transition-colors text-base flex items-center justify-between group"
                              >
                                <span
                                  className="cursor-pointer flex-grow"
                                  onClick={() => {
                                    setEditingActivity(activity);
                                    setNewActivity(activity.description);
                                  }}
                                >
                                  {activity.description}
                                </span>
                                {deletingActivityId === activity.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteActivity(activity.id);
                                        setDeletingActivityId(null);
                                      }}
                                      className="text-xs bg-rose-500 text-white px-2 py-0.5 rounded hover:bg-rose-600 transition-colors"
                                      title="Confirm delete"
                                    >
                                      Delete
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingActivityId(null);
                                      }}
                                      className="text-xs bg-secondary text-foreground px-2 py-0.5 rounded hover:bg-secondary/80 transition-colors"
                                      title="Cancel delete"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingActivityId(activity.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 hover:text-rose-600 px-2"
                                    title="Delete activity"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      ) : editingTimeBlock === block.fulltime ? (
                        <div className="border-b border-border py-2 px-1 min-h-8">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={newActivity}
                              onChange={handleInputChange}
                              placeholder="What did you do?"
                              className="flex-1 bg-transparent border-none outline-none text-foreground"
                              maxLength={MAX_CHARS}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddActivity(block.fulltime);
                                } else if (e.key === "Escape") {
                                  setEditingTimeBlock(null);
                                  setNewActivity("");
                                }
                              }}
                              onBlur={() => {
                                if (newActivity.trim()) {
                                  handleAddActivity(block.fulltime);
                                } else {
                                  setEditingTimeBlock(null);
                                }
                              }}
                            />
                            <div className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                              {newActivity.length}/{MAX_CHARS}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="border-b border-border min-h-8 py-2 px-1 relative cursor-pointer hover:bg-secondary/10 transition-colors group"
                          onClick={() => {
                            setEditingTimeBlock(block.fulltime);
                            setNewActivity("");
                          }}
                        >
                          {/* Progress bar for current time block */}
                          {block.fulltime === currentTimeBlock && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-gray-100 w-full rounded-sm">
                              <div
                                className="absolute h-full bg-rose-200 rounded-sm transition-all duration-300 ease-in-out"
                                style={{ width: `${progressInCurrentBlock}%` }}
                              >
                                <TimeIndicator time={formattedCurrentTime} />
                              </div>
                            </div>
                          )}

                          <span className="text-transparent group-hover:text-muted-foreground text-xs transition-colors flex items-center h-full">
                            Click to add activity
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
