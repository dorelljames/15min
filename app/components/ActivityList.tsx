"use client";

import { Activity } from "../types";

interface ActivityListProps {
  activities: Activity[];
  title: string;
}

export default function ActivityList({ activities, title }: ActivityListProps) {
  // Group activities by hour
  const groupedActivities: Record<string, Activity[]> = {};

  activities.forEach((activity) => {
    const hour = activity.timestamp.getHours();
    const minute = activity.timestamp.getMinutes();
    // Round to nearest 15 min block
    const roundedMinute = Math.floor(minute / 15) * 15;
    const timeKey = `${hour}:${roundedMinute.toString().padStart(2, "0")}`;

    if (!groupedActivities[timeKey]) {
      groupedActivities[timeKey] = [];
    }

    groupedActivities[timeKey].push(activity);
  });

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4">{title}</h2>

      {Object.keys(groupedActivities).length === 0 ? (
        <p className="text-gray-500">No activities logged for this period.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedActivities)
            .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
            .map(([time, timeActivities]) => (
              <div key={time} className="border rounded-lg p-4">
                <h3 className="font-medium text-lg mb-2">{time}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {timeActivities.map((activity) => (
                    <li key={activity.id} className="text-sm">
                      {activity.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
