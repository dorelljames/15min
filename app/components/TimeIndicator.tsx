import React from "react";

interface TimeIndicatorProps {
  time: string;
  className?: string;
}

const TimeIndicator: React.FC<TimeIndicatorProps> = ({
  time,
  className = "",
}) => {
  return (
    <div
      className={`absolute top-1/2 right-0 -translate-y-1/2 translate-x-full bg-rose-200 text-gray-700 text-[9px] py-0.5 px-1.5 rounded whitespace-nowrap shadow-sm ml-1 font-medium ${className}`}
    >
      {time}
    </div>
  );
};

export default TimeIndicator;
