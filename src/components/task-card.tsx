"use client";
import { useState } from "react";
import { Check, ChevronDown, Clock3 } from "lucide-react";
import type { Task } from "@/lib/domain";
import { useTraining } from "./training-provider";

export function TaskCard({
  task,
  index,
  done,
  locked,
}: {
  task: Task;
  index: number;
  done: boolean;
  locked: boolean;
}) {
  const { busy, mutate } = useTraining();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  async function toggle() {
    setSaving(true);
    try {
      await mutate({ action: "task", taskId: task.id, completed: !done });
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className={`task-card compact-task ${done ? "task-done" : ""}`}>
      <div className="task-top">
        <span className="task-index">
          {done ? <Check size={21} /> : String(index + 1).padStart(2, "0")}
        </span>
        <div className="task-copy">
          <h3>{task.name}</h3>
          <p>{task.purpose}</p>
          <div className="task-meta">
            <Clock3 size={13} />
            <span>
              {task.duration_minutes} 分钟 · {done ? "已完成" : "待完成"}
            </span>
          </div>
        </div>
      </div>
      <div className="task-actions">
        <button
          className="task-instructions"
          aria-expanded={expanded}
          aria-controls={`method-${task.id}`}
          onClick={() => setExpanded(!expanded)}
        >
          训练方法 <ChevronDown size={14} />
        </button>
        <button
          className={`task-button ${done ? "completed" : ""}`}
          disabled={busy || locked}
          aria-label={`${done ? "撤销" : "完成"} ${task.name}`}
          aria-pressed={done}
          onClick={() => void toggle()}
        >
          {done ? <Check size={16} /> : <span className="empty-check" />}
          <span>{saving ? "保存中…" : done ? "已完成" : "完成"}</span>
        </button>
      </div>
      <p className="task-description" id={`method-${task.id}`} hidden={!expanded}>
        {task.description}
      </p>
    </article>
  );
}
