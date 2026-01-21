
import React from 'react';
import { Task } from '../types';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete }) => {
  return (
    <div 
      className={`flex items-center justify-between p-4 mb-2 rounded-xl transition-all duration-200 border border-transparent
        ${task.completed ? 'bg-gray-50 opacity-60' : 'bg-white shadow-sm hover:shadow-md'}`}
    >
      <div className="flex items-center space-x-3 flex-1 cursor-pointer" onClick={() => onToggle(task.id)}>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
          ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
        >
          {task.completed && <i className="fas fa-check text-white text-xs"></i>}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm md:text-base font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.text}
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-tight">
            Added by {task.author}
          </span>
        </div>
      </div>
      
      <button 
        onClick={() => onDelete(task.id)}
        className="text-gray-400 hover:text-red-500 transition-colors p-2"
        aria-label="Delete task"
      >
        <i className="fas fa-trash-alt text-sm"></i>
      </button>
    </div>
  );
};
