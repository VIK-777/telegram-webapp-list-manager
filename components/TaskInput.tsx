
import React, { useState } from 'react';

interface TaskInputProps {
  onAdd: (text: string) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 glass-morphism border-t border-gray-200 pb-safe z-50">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex items-center space-x-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add an item..."
          className="flex-1 bg-gray-100 rounded-full py-3 px-6 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg
            ${text.trim() ? 'bg-[#2481cc] text-white scale-100' : 'bg-gray-200 text-gray-400 scale-90'}`}
        >
          <i className="fas fa-arrow-up text-lg"></i>
        </button>
      </form>
    </div>
  );
};
