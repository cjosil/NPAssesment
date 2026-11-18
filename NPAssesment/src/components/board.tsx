// src/components/Board.tsx
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Column } from '../column';
import './board.css';

// Initialize Supabase Client using public publishable/anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority?: 'low' | 'normal' | 'high';
  due_date?: string;
  user_id: string;
}

type TaskStatus = Task['status'];

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

export const Board: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const addTask = async (status: TaskStatus, title: string) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('You must be signed in to add a task');

    const { data, error: insertError } = await supabase
      .from('tasks')
      .insert({ title, status, user_id: user.id })
      .select('*')
      .single();

    if (insertError) throw insertError;
    setTasks((currentTasks) => [...currentTasks, data as Task]);
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

  return (
    <div className="task-board">
      <header className="task-board__header">
        <h1>Hello, Welcome!</h1>
      </header>

      {loading && <p className="task-board__status">Loading tasks...</p>}
      {error && (
        <p className="task-board__status task-board__status--error" role="alert">
          Could not load tasks: {error}. Check your Supabase project API URL and configuration.
        </p>
      )}

      <main className="task-board__content">
        <div className="task-board__grid">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((task) => task.status === col.id);
            return (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                headerColor={col.headerColor}
                tasks={columnTasks}
                onAddTask={addTask}
                onRemoveTask={removeTask}
                onTaskClick={(task) => console.log('Clicked task:', task.title)}
                onMoveTask={handleMoveTask}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};