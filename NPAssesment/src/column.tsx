// src/column.tsx
import React from 'react';
import { TaskCard } from './components/taskCard';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'normal' | 'high' | null;
  assignee_id: string | null;
  due_date: string | null;
  user_id: string;
}

interface ColumnProps {
  id: 'todo' | 'in_progress' | 'in_review' | 'done';
  title: string;
  headerColor: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onCreateTask: (status: ColumnProps['id']) => void;
  onRemoveTask: (task: Task) => Promise<void>;
  onMoveTask: (taskId: string, newStatus: ColumnProps['id']) => Promise<void>;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  headerColor,
  tasks,
  onTaskClick,
  onCreateTask,
  onRemoveTask,
  onMoveTask,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [moveError, setMoveError] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId').trim();
    if (!taskId) return;

    setMoveError(null);
    try {
      await onMoveTask(taskId, id);
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Failed to move task');
    }
  };

  return (
    <section
      className={`task-column${isDragOver ? ' task-column--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="task-column__header">
        <div className="task-column__label">
          <span className="task-column__dot" style={{ backgroundColor: headerColor }} />
          <h2>{title}</h2>
          <span className="task-column__count">
            {tasks.length}
          </span>
        </div>
        <button
          className="task-column__add-button"
          type="button"
          aria-label={`Create task in ${title}`}
          onClick={() => onCreateTask(id)}
        >
          +
        </button>
      </div>

      <div className="task-column__tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            id={task.id}
            title={task.title}
            description={task.description ?? undefined}
            priority={task.priority ?? undefined}
            dueDate={task.due_date ?? undefined}
            accentColor={headerColor}
            onClick={() => onTaskClick?.(task)}
            onRemove={() => onRemoveTask(task)}
          />
        ))}
      </div>

      {moveError && <p className="task-column__form-error" role="alert">{moveError}</p>}
    </section>
  );
};