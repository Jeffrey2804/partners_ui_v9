import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, useReducedMotion } from 'framer-motion';
import {
  FiAlertTriangle,
  FiClock,
  FiCheckCircle,
  FiTarget,
  FiCalendar,
  FiTag,
  FiEye,
} from 'react-icons/fi';

// ---------- config
export const VARIANTS = Object.freeze({
  overdue:   { icon: FiAlertTriangle, gradient: 'from-red-100 to-red-200',          text: 'text-red-600' },
  pending:   { icon: FiClock,         gradient: 'from-blue-100 to-blue-200',        text: 'text-blue-600' },
  completed: { icon: FiCheckCircle,   gradient: 'from-emerald-100 to-emerald-200',  text: 'text-emerald-600' },
  total:     { icon: FiTarget,        gradient: 'from-purple-100 to-purple-200',    text: 'text-purple-600' },
  events:    { icon: FiCalendar,      gradient: 'from-blue-100 to-blue-200',        text: 'text-blue-600' },
  week:      { icon: FiClock,         gradient: 'from-emerald-100 to-emerald-200',  text: 'text-emerald-600' },
  month:     { icon: FiTag,           gradient: 'from-purple-100 to-purple-200',    text: 'text-purple-600' },
  upcoming:  { icon: FiEye,           gradient: 'from-orange-100 to-orange-200',    text: 'text-orange-600' },
});

const CARD_BASE =
  'bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100';
const ICON_WRAP_BASE =
  'w-8 h-8 bg-gradient-to-br rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const defaultFormat = (v) => (typeof v === 'number' ? new Intl.NumberFormat(undefined, { notation: 'compact' }).format(v) : v ?? '—');

/**
 * StatCard — compact, accessible KPI card
 * - Optional `onClick` adds button semantics and keyboard support
 * - Respects reduced motion preferences
 * - Compact number formatting by default (override with `formatValue`)
 * - Optional loading skeleton
 */
const StatCard = memo(function StatCard({
  type = 'total',
  title = '',
  value = 0,
  description = '',
  delay = 0,
  className = '',
  as: As = 'div',
  icon: IconOverride,
  onClick,
  formatValue = defaultFormat,
  loading = false,
  ariaLive = false, // set true if value updates dynamically and should be announced
  testId,
}) {
  const cfg = VARIANTS[type] || VARIANTS.total;
  const Icon = IconOverride || cfg.icon;
  const reduced = useReducedMotion();

  const onKeyDown = useCallback(
    (e) => {
      if (!onClick) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(e);
      }
    },
    [onClick],
  );

  const interactive = Boolean(onClick);
  const role = interactive ? 'button' : 'region';
  const tabIndex = interactive ? 0 : undefined;
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={reduced ? undefined : { delay }}
      className={cn('group', CARD_BASE, interactive && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300', className)}
      aria-label={`${title}: ${displayValue}`}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      onClick={onClick}
      data-testid={testId}
    >
      <As>
        <div className="flex items-center justify-between mb-2">
          <div className={cn(ICON_WRAP_BASE, cfg.gradient)} aria-hidden="true">
            <Icon className={cn('w-4 h-4', cfg.text)} />
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{title}</p>
            <p className="text-xl font-bold text-gray-900" aria-live={ariaLive ? 'polite' : undefined} aria-atomic={ariaLive ? 'true' : undefined}>
              {loading ? (
                <span className="inline-block w-10 h-5 bg-gray-200 rounded animate-pulse" />
              ) : (
                displayValue
              )}
            </p>
          </div>
        </div>

        {description ? (
          <p className={cn('text-xs font-medium', cfg.text)}>{description}</p>
        ) : null}
      </As>
    </motion.div>
  );
});

StatCard.propTypes = {
  type: PropTypes.oneOf(Object.keys(VARIANTS)),
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  description: PropTypes.string,
  delay: PropTypes.number,
  className: PropTypes.string,
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  icon: PropTypes.elementType,
  onClick: PropTypes.func,
  formatValue: PropTypes.func,
  loading: PropTypes.bool,
  ariaLive: PropTypes.bool,
  testId: PropTypes.string,
};

export default StatCard;
