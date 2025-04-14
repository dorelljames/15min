"use client";

import { useEffect, useState } from "react";

import { Activity } from "../types";
import TimelineView from "./TimelineView";

export default function ActivityTracker() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const today = new Date();

  // Format date for display
  const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "long" });
  const month = today.toLocaleDateString("en-US", { month: "long" });
  const dayOfMonth = today.getDate();

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

  // Filter activities to show only today
  const todayActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.timestamp);
    return (
      activityDate.getDate() === today.getDate() &&
      activityDate.getMonth() === today.getMonth() &&
      activityDate.getFullYear() === today.getFullYear()
    );
  });

  return (
    <div className="max-w-3xl mx-auto p-6 pt-8 pb-16 relative min-h-screen">
      <div className="mb-8 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-3">
        <div className="flex flex-col">
          <span className="text-xl text-foreground/80">
            {dayOfWeek} <span className="text-rose-500">{month}</span>
          </span>
          <span className="text-6xl font-light text-foreground">
            {dayOfMonth}
          </span>
        </div>
      </div>

      <TimelineView
        activities={todayActivities}
        onToggleActivity={handleToggleActivity}
        onAddActivity={handleAddActivity}
        onUpdateActivity={handleUpdateActivity}
        onDeleteActivity={handleDeleteActivity}
      />
    </div>
  );
}
