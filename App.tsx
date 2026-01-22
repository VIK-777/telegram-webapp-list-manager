
import React, { useState, useEffect, useCallback } from 'react';
import { Task, AppStatus } from './types';
import { TaskItem } from './components/TaskItem';
import { TaskInput } from './components/TaskInput';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('My Shared List');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [currentUser, setCurrentUser] = useState('Guest User');

  // Load from local storage on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('telelist_tasks');
    const savedTitle = localStorage.getItem('telelist_title');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedTitle) setTitle(savedTitle);

    // Mock Telegram user info extraction
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user?.first_name) {
      setCurrentUser(tg.initDataUnsafe.user.first_name);
    }
    
    // Set theme and expand Telegram app
    tg?.ready();
    tg?.expand();
  }, []);

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('telelist_tasks', JSON.stringify(tasks));
    localStorage.setItem('telelist_title', title);
  }, [tasks, title]);

  const addTask = useCallback((text: string, authorOverride?: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      author: authorOverride || currentUser,
      createdAt: Date.now()
    };
    setTasks(prev => [newTask, ...prev]);
  }, [currentUser]);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => !t.completed));
  };

  return (
    <div className="min-h-screen pb-32 flex flex-col">
      {/* Header */}
      <header className="bg-[#2481cc] text-white p-6 pt-10 shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <input 
                autoFocus
                className="bg-transparent border-b-2 border-white text-2xl font-bold focus:outline-none w-full mr-4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <h1 
                className="text-2xl font-bold cursor-pointer flex items-center space-x-2"
                onClick={() => setIsEditingTitle(true)}
              >
                <span>{title}</span>
                <i className="fas fa-pen text-sm opacity-50"></i>
              </h1>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs opacity-80 uppercase tracking-widest">
            <span className="bg-green-400 w-2 h-2 rounded-full"></span>
            <span>Collaborative Session</span>
            <span className="mx-2">•</span>
            <span>{tasks.length} items</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        
        {/* Task List */}
        <section>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <i className="fas fa-clipboard-list text-3xl"></i>
              </div>
              <p className="text-lg font-medium">No items yet</p>
              <p className="text-sm text-center px-10">Add something to your shared list to get started with your friends!</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs font-bold text-gray-500 uppercase">Items</span>
                {tasks.some(t => t.completed) && (
                  <button 
                    onClick={clearCompleted}
                    className="text-xs font-bold text-red-500 uppercase hover:underline"
                  >
                    Clear Completed
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {tasks.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    onToggle={toggleTask} 
                    onDelete={deleteTask} 
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Input Field */}
      <TaskInput onAdd={addTask} />

      {/* User Status Toast (Floating) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/70 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center space-x-2">
           <i className="fas fa-user text-green-400"></i>
           <span>Acting as <strong>{currentUser}</strong></span>
        </div>
      </div>
    </div>
  );
};

export default App;
