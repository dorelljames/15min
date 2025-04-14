"use client";

import { Activity } from "../types";
import { useState } from "react";

interface ActivityFormProps {
  onAddActivity: (activity: Activity) => void;
}

export default function ActivityForm({ onAddActivity }: ActivityFormProps) {
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newActivity: Activity = {
      id: crypto.randomUUID(),
      description: description.trim(),
      timestamp: new Date(),
    };

    onAddActivity(newActivity);
    setDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mb-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you do in the last 15 minutes?"
          className="flex-grow px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add
        </button>
      </div>
    </form>
  );
}
