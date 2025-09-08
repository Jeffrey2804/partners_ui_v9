/**
 * Enhanced Timezone Dropdown Component
 *
 * This component renders timezone options similar to GHL's backend
 * with sections for current, recommended, and all timezones.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiRefreshCw, FiChevronDown, FiCheck } from 'react-icons/fi';
import {
  getEnhancedTimezoneOptions,
  startTimezoneAutoRefresh,
  stopTimezoneAutoRefresh,
} from '../../services/enhancedTimezoneService';

const EnhancedTimezoneDropdown = ({
  value,
  onChange,
  locationId = null,
  disabled = false,
  placeholder = 'Select timezone...',
  className = '',
  onRefresh = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [timezoneData, setTimezoneData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Load timezone options
  const loadTimezones = useCallback(async () => {
    setIsLoading(true);
    try {
      console.warn('🌍 Loading enhanced timezone options...');
      const data = await getEnhancedTimezoneOptions(locationId, value);
      setTimezoneData(data);
      console.warn('✅ Timezone options loaded:', data.totalTimezones);
    } catch (error) {
      console.error('❌ Failed to load timezone options:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [locationId, value]);

  // Load timezones on mount and when locationId changes
  useEffect(() => {
    loadTimezones();
  }, [locationId, loadTimezones]);

  // Start auto-refresh for GHL backend timezone updates
  useEffect(() => {
    console.warn('🔄 Starting timezone auto-refresh...');
    startTimezoneAutoRefresh();

    return () => {
      console.warn('🛑 Stopping timezone auto-refresh...');
      stopTimezoneAutoRefresh();
    };
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    await loadTimezones();
    if (onRefresh) onRefresh();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search
  const getFilteredOptions = (options) => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(query) ||
      option.displayName.toLowerCase().includes(query) ||
      option.value.toLowerCase().includes(query),
    );
  };

  // Get display label for selected value
  const getSelectedLabel = () => {
    if (!value || !timezoneData) return placeholder;
    const option = timezoneData.flatOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Handle option selection
  const handleSelect = (timezone) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Header with label and refresh button */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Timezone:
        </label>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          title="Refresh timezone list"
        >
          <FiRefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Dropdown trigger */}
      <div
        className={`
          w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base font-medium 
          transition-all duration-200 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
          ${isOpen ? 'border-blue-400 ring-4 ring-blue-100' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className={`${!value ? 'text-gray-500' : 'text-gray-900'}`}>
            {getSelectedLabel()}
          </span>
          <FiChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search timezones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <FiRefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
              Loading timezones...
            </div>
          )}

          {/* Options */}
          {!isLoading && timezoneData && (
            <div className="max-h-64 overflow-y-auto">
              {/* Current timezone section */}
              {timezoneData.sections.current && (
                <div className="border-b border-gray-100">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    {timezoneData.sections.current.title}
                  </div>
                  {getFilteredOptions(timezoneData.sections.current.options).map((option) => (
                    <div
                      key={`current-${option.value}`}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                      onClick={() => handleSelect(option.value)}
                    >
                      <span className="text-sm text-gray-900">{option.label}</span>
                      {option.value === value && (
                        <FiCheck className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended timezones section */}
              {timezoneData.sections.recommended.options.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                    {timezoneData.sections.recommended.title}
                  </div>
                  {getFilteredOptions(timezoneData.sections.recommended.options).map((option) => (
                    <div
                      key={`recommended-${option.value}`}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                      onClick={() => handleSelect(option.value)}
                    >
                      <span className="text-sm text-gray-900">{option.label}</span>
                      {option.value === value && (
                        <FiCheck className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* All timezones section */}
              <div>
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                  {timezoneData.sections.all.title}
                </div>
                {getFilteredOptions(timezoneData.sections.all.options).map((option) => (
                  <div
                    key={`all-${option.value}`}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                    onClick={() => handleSelect(option.value)}
                  >
                    <span className="text-sm text-gray-900">{option.label}</span>
                    {option.value === value && (
                      <FiCheck className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                ))}
              </div>

              {/* No results message */}
              {searchQuery &&
               timezoneData.sections.all.options.length > 0 &&
               getFilteredOptions(timezoneData.sections.all.options).length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No timezones found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTimezoneDropdown;
