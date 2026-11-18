import React, { useEffect, useState } from 'react';

export type TaskPriority = 'low' | 'normal' | 'high';

export interface TaskFormData {
  title: string;
  description: string;
  priority: TaskPriority;
  due_date: string;
  assignee_id: string;
}

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  onSubmit: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  isEditing,
  formData,
  setFormData,
  onSubmit,
  onDelete,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSaving, onClose]);

  if (!isOpen) return null;

  const updateField = <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="task-drawer-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        className="task-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-drawer-title"
      >
        <header className="task-drawer__header">
          <h2 id="task-drawer-title">{isEditing ? 'Edit Task Details' : 'Create New Task'}</h2>
          <button
            type="button"
            className="task-drawer__close"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close task details"
          >
            &times;
          </button>
        </header>

        <form className="task-drawer__form" onSubmit={handleSubmit}>
          <label className="task-drawer__field">
            <span>Title *</span>
            <input
              type="text"
              required
              maxLength={200}
              autoFocus
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              placeholder="Task summary..."
              disabled={isSaving}
            />
          </label>

          <label className="task-drawer__field">
            <span>Description</span>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="Add detailed context or requirements..."
              disabled={isSaving}
            />
          </label>

          <div className="task-drawer__field-row">
            <label className="task-drawer__field">
              <span>Priority</span>
              <select
                value={formData.priority}
                onChange={(event) => updateField('priority', event.target.value as TaskPriority)}
                disabled={isSaving}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>

            <label className="task-drawer__field">
              <span>Due date</span>
              <input
                type="date"
                value={formData.due_date}
                onChange={(event) => updateField('due_date', event.target.value)}
                disabled={isSaving}
              />
            </label>
          </div>

          <label className="task-drawer__field">
            <span>Assignee user ID</span>
            <input
              type="text"
              value={formData.assignee_id}
              onChange={(event) => updateField('assignee_id', event.target.value)}
              placeholder="Optional Supabase user UUID"
              disabled={isSaving}
            />
          </label>

          {error && <p className="task-drawer__error" role="alert">{error}</p>}

          <footer className="task-drawer__footer">
            {isEditing && onDelete ? (
              <button
                type="button"
                className="task-drawer__delete"
                onClick={handleDelete}
                disabled={isSaving}
              >
                {isSaving ? 'Please wait...' : 'Delete task'}
              </button>
            ) : <span />}

            <div className="task-drawer__actions">
              <button type="button" onClick={onClose} disabled={isSaving}>
                Cancel
              </button>
              <button
                type="submit"
                className="task-drawer__save"
                disabled={isSaving || !formData.title.trim()}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save changes' : 'Create task'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
};
