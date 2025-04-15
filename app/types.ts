export interface Activity {
  id: string;
  description: string;
  timestamp: Date;
  completed: boolean; // Keeping for backward compatibility
  timeBlock: string; // Format: "HH:MM" - representing 15-min blocks like "09:00", "09:15", etc.
}

export interface DailySummary {
  date: string; // Format: "YYYY-MM-DD"
  summary: {
    text: string;
    isAI: boolean;
  };
}
