import { Check } from "lucide-react";
import { shiftDate, trainingStats } from "@/lib/streak";
export function WeekStrip({ dates, today }: { dates: string[]; today: string }) {
  const { monday } = trainingStats(dates, today);
  return (
    <div className="week-strip">
      {["一", "二", "三", "四", "五", "六", "日"].map((label, i) => {
        const date = shiftDate(monday, i),
          done = dates.includes(date);
        return (
          <div
            className={`week-day ${date === today ? "today" : ""} ${done ? "done" : ""} ${date > today ? "future" : ""}`}
            key={date}
            aria-label={`${date}${done ? " 已打卡" : date > today ? " 未开始" : " 未打卡"}`}
          >
            <span>周{label}</span>
            <div>{done ? <Check size={18} /> : date.slice(-2)}</div>
            {date === today ? <span className="today-dot" /> : <span className="day-placeholder" />}
          </div>
        );
      })}
    </div>
  );
}
