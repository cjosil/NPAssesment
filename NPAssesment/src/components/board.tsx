// src/components/Board.tsx
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Column } from '../column';
import { TaskDrawer, type TaskFormData, type TaskPriority } from './taskDrawer';
import './board.css';

// Initialize Supabase Client using public publishable/anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: TaskPriority | null;
  due_date: string | null;
  assignee_id: string | null;
  user_id: string;
}

type TaskStatus = Task['status'];
type PriorityFilter = TaskPriority | 'all' | 'none';
type AssigneeFilter = string | 'all' | 'unassigned';

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  headerColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', headerColor: '#ff0000' },         // Slate
  { id: 'in_progress', title: 'In Progress', headerColor: '#3b82f6' }, // Blue
  { id: 'in_review', title: 'In Review', headerColor: '#f59e0b' },   // Amber
  { id: 'done', title: 'Done', headerColor: '#10b981' },             // Emerald
];

const EMPTY_FORM: TaskFormData = {
  title: '',
  description: '',
  priority: 'normal',
  due_date: '',
  assignee_id: '',
};

export const Board: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);
  const [createStatus, setCreateStatus] = useState<TaskStatus>('todo');
  const [today] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 10);
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');

  useEffect(() => {
    async function initSessionAndFetchTasks() {
      try {
        setLoading(true);
        // Ensure anonymous guest session is active
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;

        if (!authData.session) {
          const { error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
        }

        // Fetch tasks from Supabase
        const { data, error: fetchError } = await supabase
          .from('tasks')
          .select('*');

        if (fetchError) throw fetchError;
        setTasks(data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load board data');
      } finally {
        setLoading(false);
      }
    }

    initSessionAndFetchTasks();
  }, []);

  const handleOpenCreate = (status: TaskStatus) => {
    setSelectedTask(null);
    setCreateStatus(status);
    setFormData(EMPTY_FORM);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description ?? '',
      priority: task.priority ?? 'normal',
      due_date: task.due_date ?? '',
      assignee_id: task.assignee_id ?? '',
    });
    setIsDrawerOpen(true);
  };

  const handleSubmitTask = async () => {
    const title = formData.title.trim();
    if (!title) throw new Error('A task title is required');

    const taskFields = {
      title,
      description: formData.description.trim() || null,
      priority: formData.priority,
      due_date: formData.due_date || null,
      assignee_id: formData.assignee_id.trim() || null,
    };

    if (selectedTask) {
      const { data, error: updateError } = await supabase
        .from('tasks')
        .update(taskFields)
        .eq('id', selectedTask.id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      setTasks((currentTasks) =>
        currentTasks.map((task) => task.id === selectedTask.id ? data as Task : task)
      );
    } else {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be signed in to create a task');

      const { data, error: insertError } = await supabase
        .from('tasks')
        .insert({ ...taskFields, status: createStatus, user_id: user.id })
        .select('*')
        .single();

      if (insertError) throw insertError;
      setTasks((currentTasks) => [...currentTasks, data as Task]);
    }

    setIsDrawerOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteSelectedTask = async () => {
    if (!selectedTask) return;
    await removeTask(selectedTask);
    setIsDrawerOpen(false);
    setSelectedTask(null);
  };

  const removeTask = async (task: Task) => {
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', task.id)
      .select('id')
      .single();

    if (deleteError) throw deleteError;
    setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask.id !== task.id));
  };

  const handleMoveTask = async (
    taskId: string,
    newStatus: TaskStatus
  ) => {
    const existingTask = tasks.find((task) => task.id === taskId);
    if (!existingTask || existingTask.status === newStatus) return;

    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
      .select('id')
      .single();

    if (updateError) throw updateError;
    if (!data) throw new Error('Task was not found or you do not have permission to move it');

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const filteredTasks = tasks.filter((task) => {
    const matchesTitle = task.title.toLocaleLowerCase().includes(normalizedSearch);
    const matchesPriority =
      priorityFilter === 'all' ||
      (priorityFilter === 'none' ? task.priority === null : task.priority === priorityFilter);
    const matchesAssignee =
      assigneeFilter === 'all' ||
      (assigneeFilter === 'unassigned'
        ? !task.assignee_id
        : task.assignee_id === assigneeFilter);

    return matchesTitle && matchesPriority && matchesAssignee;
  });
  const assigneeOptions = Array.from(
    new Set(tasks.map((task) => task.assignee_id).filter((assignee): assignee is string => Boolean(assignee)))
  ).sort((first, second) => first.localeCompare(second));
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const overdueTasks = tasks.filter(
    (task) => task.status !== 'done' && task.due_date !== null && task.due_date < today
  ).length;

  return (
    <div className="task-board">
      <header className="task-board__header">
        <h1>Hello, Welcome!</h1>
        <div className="task-board__stats" aria-label="Board summary">
          <div className="task-board__stat">
            <span>Total tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="task-board__stat">
            <span>Completed</span>
            <strong>{completedTasks}</strong>
          </div>
          <div className="task-board__stat">
            <span>Overdue</span>
            <strong>{overdueTasks}</strong>
          </div>
        </div>
      </header>

      {loading && <p className="task-board__status">Loading tasks...</p>}
      {error && (
        <p className="task-board__status task-board__status--error" role="alert">
          Could not load tasks: {error}. Check your Supabase project API URL and configuration.
        </p>
      )}

      <main className="task-board__content">
        <section className="task-board__filters" aria-label="Filter tasks">
          <label className="task-board__search">
            <span>Search by title</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks..."
            />
          </label>

          <label className="task-board__filter">
            <span>Priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)}
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
              <option value="none">No priority</option>
            </select>
          </label>

          <label className="task-board__filter">
            <span>Assignee</span>
            <select
              value={assigneeFilter}
              onChange={(event) => setAssigneeFilter(event.target.value as AssigneeFilter)}
            >
              <option value="all">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {assigneeOptions.map((assigneeId) => (
                <option key={assigneeId} value={assigneeId}>{assigneeId}</option>
              ))}
            </select>
          </label>

          {(searchQuery || priorityFilter !== 'all' || assigneeFilter !== 'all') && (
            <button
              className="task-board__clear-filters"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('all');
                setAssigneeFilter('all');
              }}
            >
              Clear filters
            </button>
          )}
          <span className="task-board__result-count">
            Showing {filteredTasks.length} of {tasks.length}
          </span>
        </section>

        <div className="task-board__grid">
          {COLUMNS.map((col) => {
            const columnTasks = filteredTasks.filter((task) => task.status === col.id);
            return (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                headerColor={col.headerColor}
                tasks={columnTasks}
                onCreateTask={handleOpenCreate}
                onRemoveTask={removeTask}
                onTaskClick={handleOpenEdit}
                onMoveTask={handleMoveTask}
              />
            );
          })}
        </div>
      </main>

      <TaskDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isEditing={selectedTask !== null}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmitTask}
        onDelete={selectedTask ? handleDeleteSelectedTask : undefined}
      />
    </div>
  );
};