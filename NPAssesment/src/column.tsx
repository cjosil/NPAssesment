// src/column.tsx
import React from 'react';
import { TaskCard } from './components/taskCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority?: 'low' | 'normal' | 'high';
  due_date?: string;
}

interface ColumnProps {
  id: string;
  title: string;
  headerColor: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

export const Column: React.FC<ColumnProps> = ({
  title,
  headerColor,
  tasks,
  onTaskClick,
}) => {
  return (
    <div className="bg-slate-50/70 rounded-xl p-4 flex flex-col max-h-full border border-slate-200/60">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: headerColor }} />
          <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Task List Area */}
      <div className="flex flex-col gap-3 overflow-y-auto min-h-[150px] flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description}
            priority={task.priority}
            dueDate={task.due_date}
            accentColor={headerColor}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
      </div>
    </div>
  );
};