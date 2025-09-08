import React, { memo, forwardRef, useMemo, useId, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiX } from 'react-icons/fi';

const cn = (...c) => c.filter(Boolean).join(' ');

const INPUT_BASE =
  'w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#01818E]/10 focus:border-[#01818E] hover:border-gray-300 transition-all duration-300 shadow-sm bg-white placeholder-gray-400';
const SELECT_BASE =
  'border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#01818E]/10 focus:border-[#01818E] hover:border-gray-300 transition-all duration-300 shadow-sm bg-white';

const SIZES = {
  sm: { input: 'pl-8 pr-8 py-2 text-sm', icon: 'h-4 w-4', clearBtn: 'p-1', leftPad: 'left-2' },
  md: { input: 'pl-9 pr-8 py-2.5 text-sm', icon: 'h-4 w-4', clearBtn: 'p-1', leftPad: 'left-3' },
  lg: { input: 'pl-10 pr-10 py-3 text-base', icon: 'h-5 w-5', clearBtn: 'p-1.5', leftPad: 'left-3.5' },
};

const normalizeOptions = (options) => {
  const seen = new Set();
  const out = [];
  for (const o of options || []) {
    const opt =
      typeof o === 'string'
        ? { value: o, label: o }
        : { value: o?.value ?? o?.label ?? '', label: o?.label ?? String(o?.value ?? '') };
    if (!opt.value && !opt.label) continue;
    if (seen.has(opt.value)) continue;
    seen.add(opt.value);
    out.push(opt);
  }
  return out;
};

/**
 * SearchInput — accessible, flexible search with optional filter select
 * - Supports `onChange` (event) and/or `onValueChange` (string)
 * - Optional clear button (uses `onClear` or falls back to `onValueChange('')`)
 * - Size variants and icon overrides
 */
const SearchInput = memo(
  forwardRef(function SearchInput(
    {
      value = '',
      onChange,
      onValueChange,
      placeholder = 'Search…',
      className = 'max-w-lg',
      showFilter = false,
      filterValue,
      onFilterChange,
      filterOptions = [],
      onClear, // optional: provide to take full control of clearing
      id,
      name,
      label, // optional visible or sr-only label text
      filterLabel = 'Filter',
      size = 'md', // 'sm' | 'md' | 'lg'
      disabled = false,
      leftIcon: LeftIcon = FiSearch,
      rightIcon: RightIcon,
      inputProps,
      selectProps,
      testId,
    },
    ref,
  ) {
    const options = useMemo(() => normalizeOptions(filterOptions), [filterOptions]);
    const inputId = id || useId();
    const sizeCfg = SIZES[size] || SIZES.md;

    const handleChange = useCallback(
      (e) => {
        onChange && onChange(e);
        if (onValueChange) onValueChange(e.target.value);
      },
      [onChange, onValueChange],
    );

    const canClear = !!value && (typeof onClear === 'function' || typeof onValueChange === 'function');
    const handleClear = useCallback(() => {
      if (onClear) onClear();
      else if (onValueChange) onValueChange('');
    }, [onClear, onValueChange]);

    return (
      <div className="flex items-center gap-3" role="search" data-testid={testId}>
        <div className={cn('relative flex-1', className)}>
          {label && (
            <label htmlFor={inputId} className="sr-only">
              {label}
            </label>
          )}

          <LeftIcon
            className={cn('pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400', sizeCfg.icon, sizeCfg.leftPad)}
            aria-hidden="true"
          />

          <input
            ref={ref}
            id={inputId}
            name={name}
            type="search"
            inputMode="search"
            autoComplete="off"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(INPUT_BASE, sizeCfg.input)}
            aria-label={!label ? placeholder : undefined}
            {...inputProps}
          />

          {/* Right adornment: clear button wins; otherwise optional right icon */}
          {canClear ? (
            <button
              type="button"
              onClick={handleClear}
              className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100', sizeCfg.clearBtn)}
              aria-label="Clear search"
            >
              <FiX className={sizeCfg.icon} />
            </button>
          ) : RightIcon ? (
            <RightIcon className={cn('absolute right-2 top-1/2 -translate-y-1/2 text-gray-400', sizeCfg.icon)} aria-hidden="true" />
          ) : null}
        </div>

        {showFilter && options.length > 0 && (
          <select
            value={filterValue}
            onChange={onFilterChange}
            className={SELECT_BASE}
            aria-label={filterLabel}
            {...selectProps}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }),
);

SearchInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func,
  onValueChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  showFilter: PropTypes.bool,
  filterValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onFilterChange: PropTypes.func,
  filterOptions: PropTypes.array,
  onClear: PropTypes.func,
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  filterLabel: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  leftIcon: PropTypes.elementType,
  rightIcon: PropTypes.elementType,
  inputProps: PropTypes.object,
  selectProps: PropTypes.object,
  testId: PropTypes.string,
};

export default SearchInput;
