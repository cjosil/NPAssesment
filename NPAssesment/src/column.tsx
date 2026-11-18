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
  user_id: string;
}

interface ColumnProps {
  id: 'todo' | 'in_progress' | 'in_review' | 'done';
  title: string;
  headerColor: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask: (status: ColumnProps['id'], title: string) => Promise<void>;
  onRemoveTask: (task: Task) => Promise<void>;
  onMoveTask: (taskId: string, newStatus: ColumnProps['id']) => Promise<void>;
}

export const Column: React.FC<ColumnProps> = ({
  id,
  title,
  headerColor,
  tasks,
  onTaskClick,
  onAddTask,
  onRemoveTask,
  onMoveTask,
}) => {
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [moveError, setMoveError] = React.useState<string | null>(null);

  const handleAddTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = newTaskTitle.trim();
    if (!trimmedTitle || isSubmitting) return;

    setIsSubmitting(true);
    setAddError(null);
    try {
      await onAddTask(id, trimmedTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
    } catch (error) {
      setAddError(error instanceof Error ? error.message : 'Failed to add task');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          onClick={() => {
            setAddError(null);
            setIsAddingTask(true);
          }}
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
            description={task.description}
            priority={task.priority}
            dueDate={task.due_date}
            accentColor={headerColor}
            onClick={() => onTaskClick?.(task)}
            onRemove={() => onRemoveTask(task)}
          />
        ))}
      </div>

      {moveError && <p className="task-column__form-error" role="alert">{moveError}</p>}

      {isAddingTask && (
        <form className="task-column__add-task-form" onSubmit={handleAddTask}>
          <input
            id={`new-task-${id}`}
            type="text"
            placeholder="Enter task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
            maxLength={200}
            required
            disabled={isSubmitting}
          />
          {addError && <p className="task-column__form-error" role="alert">{addError}</p>}
          <div className="task-column__form-actions">
            <button type="submit" disabled={isSubmitting || !newTaskTitle.trim()}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle('');
                setAddError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
};