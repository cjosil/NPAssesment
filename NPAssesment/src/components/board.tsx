// src/components/Board.tsx
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Column } from '../column';

// Initialize Supabase Client using public publishable/anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority?: 'low' | 'normal' | 'high';
  due_date?: string;
  user_id: string;
}

interface ColumnConfig {
  id: 'todo' | 'in_progress' | 'in_review' | 'done';
  title: string;
  headerColor: string;
}

const COLUMNS: ColumnConfig[] = [
  { id: 'todo', title: 'To Do', headerColor: '#94a3b8' },         // Slate
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

  if (loading) return <div className="p-8 text-center text-slate-500">Loading board...</div>;
  if (error) return <div className="p-8 text-center text-rose-500">Error: {error}</div>;

  return (
    <div className="h-screen w-screen bg-slate-100 flex flex-col overflow-hidden">
      {/* Board Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Next Play Games Task Board</h1>
      </header>

      {/* Main 4-Column Grid Layout */}
      <main className="flex-1 p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full items-start">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((task) => task.status === col.id);
            return (
              <Column
                key={col.id}
                id={col.id}
                title={col.title}
                headerColor={col.headerColor}
                tasks={columnTasks}
                onTaskClick={(task) => console.log('Clicked task:', task.title)}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};