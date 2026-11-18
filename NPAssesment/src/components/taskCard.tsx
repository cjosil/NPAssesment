import React from 'react';

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  dueDate?: string;
  accentColor?: string; // Optional custom header/border color
  onClick?: () => void;
  onRemove: () => Promise<void>;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  id,
  title,
  description,
  priority,
  dueDate,
  accentColor = '#e5e7eb',
  onClick,
  onRemove,
}) => {
  const [isRemoving, setIsRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  const handleRemove = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isRemoving) return;

    setIsRemoving(true);
    setRemoveError(null);
    try {
      await onRemove();
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'Failed to remove task');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      data-task-id={id}
      onClick={onClick}
      onDragStart={handleDragStart}
      draggable
      className="task-card"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="task-card__heading">
        <h3>{title}</h3>
        {priority && (
          <span className={`task-card__priority task-card__priority--${priority}`}>
            {priority}
          </span>
        )}
        <button
          className="task-card__remove"
          type="button"
          aria-label={`Remove ${title}`}
          title={`Remove ${title}`}
          onClick={handleRemove}
          disabled={isRemoving}
        >
          {isRemoving ? 'Removing...' : 'Remove'}
        </button>
      </div>

      {description && (
        <p className="task-card__description">{description}</p>
      )}

      {removeError && (
        <p className="task-card__remove-error" role="alert">{removeError}</p>
      )}

      <div className="task-card__footer">
        {dueDate && <span>Due: {dueDate}</span>}
      </div>
    </div>
  );
};