// components/ActionInput.jsx
import { useState } from 'react';

const predefinedOptions = [
  { value: 'Call', label: 'Call' },
  { value: 'Schedule Now', label: 'Schedule Now' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Reassign', label: 'Reassign' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Send Email', label: 'Send Email' },
  { value: 'Follow Up', label: 'Follow Up' },
];

const ActionInput = ({ value = [], onChange, max = 5 }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectOption = (option) => {
    if (value.length < max && !value.some(v => v.value === option.value)) {
      onChange([...value, option]);
    }
    setIsOpen(false);
  };

  const handleCreateOption = () => {
    if (inputValue.trim() && value.length < max && !value.some(v => v.value === inputValue.trim())) {
      const newOption = { value: inputValue.trim(), label: inputValue.trim() };
      onChange([...value, newOption]);
      setInputValue('');
    }
    setIsOpen(false);
  };

  const handleRemoveOption = (optionToRemove) => {
    onChange(value.filter(v => v.value !== optionToRemove.value));
  };

  const handleClear = () => {
    onChange([]);
  };

  const availableOptions = predefinedOptions.filter(
    option => !value.some(v => v.value === option.value),
  );

  return (
    <div className="relative mt-1">
      {/* Selected values display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {value.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center px-2 py-1 text-xs bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-full"
            >
              {option.label}
              <button
                type="button"
                onClick={() => handleRemoveOption(option)}
                className="ml-1 text-teal-600 dark:text-teal-300 hover:text-red-500 dark:hover:text-red-400"
              >
                ×
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (inputValue.trim()) {
                handleCreateOption();
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder="Select or create actions..."
          disabled={value.length >= max}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ▼
        </button>
      </div>

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {availableOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelectOption(option)}
              className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
            >
              {option.label}
            </button>
          ))}
          {inputValue.trim() && !availableOptions.some(opt => opt.value.toLowerCase() === inputValue.trim().toLowerCase()) && (
            <button
              type="button"
              onClick={handleCreateOption}
              className="w-full px-3 py-2 text-left hover:bg-teal-50 dark:hover:bg-teal-900 text-teal-600 dark:text-teal-400 focus:outline-none focus:bg-teal-50 dark:focus:bg-teal-900 border-t border-gray-200 dark:border-gray-600"
            >
              Create "{inputValue.trim()}"
            </button>
          )}
          {availableOptions.length === 0 && !inputValue.trim() && (
            <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
              No more options available
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ActionInput;
