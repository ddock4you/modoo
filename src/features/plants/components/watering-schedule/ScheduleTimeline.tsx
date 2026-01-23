import clsx from "clsx";

interface ScheduleTimelineProps {
  currentDay: number;
  selectedDay: number;
  onDaySelect: (day: number) => void;
}

export function ScheduleTimeline({ currentDay, selectedDay, onDaySelect }: ScheduleTimelineProps) {
  const progressPercentage = (selectedDay / 7) * 100;

  return (
    <div className="mb-4">
      <div className="relative h-2 bg-gray-200 rounded-full mb-3 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-[#22875F] rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const isCurrentDay = day === currentDay;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              onClick={() => onDaySelect(day)}
              className={clsx(
                "flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22875F] focus-visible:ring-offset-2",
                {
                  "text-[#22875F] font-bold": isCurrentDay && !isSelected,
                  "bg-[#22875F] text-white font-bold": isSelected,
                  "text-gray-500": !isCurrentDay && !isSelected,
                }
              )}
              aria-label={`${day}일`}
              aria-pressed={isSelected}
            >
              {day}일
            </button>
          );
        })}
      </div>
    </div>
  );
}
