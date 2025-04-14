"use client";

import { Activity } from "../types";
import { useState } from "react";

interface TimelineViewProps {
  activities: Activity[];
  onToggleActivity: (id: string) => void;
  onAddActivity: (description: string, timeBlock: string) => void;
  onUpdateActivity?: (id: string, description: string) => void;
}

export default function TimelineView({
  activities,
  onToggleActivity,
  onAddActivity,
  onUpdateActivity = (id, description) => {}, // Default empty function
}: TimelineViewProps) {
  const [newActivity, setNewActivity] = useState("");
  const [editingTimeBlock, setEditingTimeBlock] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const today = new Date();

  // Twitter-length character limit
  const MAX_CHARS = 280;

  // Generate time blocks for the day (starting at 6:00 AM)
  const startHour = 6;
  const hours = 16; // Show 16 hours (6 AM to 10 PM)
  const timeBlocks = Array.from({ length: hours * 4 }, (_, i) => {
    const hour = Math.floor(i / 4) + startHour;
    const minute = (i % 4) * 15;
    return {
      time: `${hour}:${minute.toString().padStart(2, "0")}`,
      display: `${hour}:${minute.toString().padStart(2, "0")}`,
      hour12: `${hour > 12 ? hour - 12 : hour}:${minute
        .toString()
        .padStart(2, "0")}`,
      ampm: hour >= 12 ? "PM" : "AM",
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

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative">
        {/* Left timeline with vertical line */}
        <div className="absolute left-20 top-0 bottom-0 w-[1px] bg-gray-200"></div>

        <div>
          {timeBlocks.map((block, index) => {
            // Find activities for this time block
            const blockActivities = activityByTimeBlock[block.fulltime] || [];
            const hasActivities = blockActivities.length > 0;

            return (
              <div key={block.fulltime} className="relative">
                {/* Add hour marker and time label */}
                {block.isFirstOfHour && (
                  <div className="h-10 flex items-center">
                    <div className="w-20 text-right pr-4">
                      <div className="text-gray-500 text-sm">
                        {block.hour12}
                      </div>
                      <div className="text-gray-500 text-xs">{block.ampm}</div>
                    </div>
                  </div>
                )}

                <div className="flex h-12">
                  {" "}
                  {/* Fixed height for consistency */}
                  {/* Time column spacer */}
                  <div className="w-20"></div>
                  {/* Timeline dot */}
                  <div className="w-[2px] self-stretch relative">
                    <div
                      className={`absolute w-[6px] h-[6px] rounded-full bg-white border-2 ${
                        hasActivities ? "border-rose-300" : "border-gray-200"
                      } left-[-2.5px] top-[calc(50%-3px)]`}
                    ></div>
                  </div>
                  {/* Activity card area with consistent height */}
                  <div className="flex-1 pl-5 flex items-center">
                    <div className="w-full">
                      {hasActivities ? (
                        <div className="border-b border-gray-200 py-2 px-1 min-h-8">
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
                                  className="flex-1 bg-transparent border-none outline-none text-gray-700 py-1"
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
                                <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                  {newActivity.length}/{MAX_CHARS}
                                </div>
                              </div>
                            ) : (
                              <div
                                key={activity.id}
                                className="py-1 text-gray-600 cursor-pointer hover:bg-gray-50 rounded px-1 transition-colors"
                                onClick={() => {
                                  setEditingActivity(activity);
                                  setNewActivity(activity.description);
                                }}
                              >
                                {activity.description}
                              </div>
                            )
                          )}
                        </div>
                      ) : editingTimeBlock === block.fulltime ? (
                        <div className="border-b border-gray-200 py-2 px-1 min-h-8">
                          <div className="flex items-center">
                            <input
                              type="text"
                              value={newActivity}
                              onChange={handleInputChange}
                              placeholder="What did you do?"
                              className="flex-1 bg-transparent border-none outline-none text-gray-700"
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
                            <div className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                              {newActivity.length}/{MAX_CHARS}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="h-8 flex items-center cursor-pointer hover:bg-gray-50 px-1 text-gray-400 text-xs border-b border-gray-100"
                          onClick={() => setEditingTimeBlock(block.fulltime)}
                        >
                          + Add
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
