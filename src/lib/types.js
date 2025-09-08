// Types for dashboard UI (now as JSDoc comments)

/**
 * @typedef {Object} ChartPoint
 * @property {string} x
 * @property {number} y
 */

/**
 * @typedef {Object} KPI
 * @property {string} id
 * @property {string} title
 * @property {string} value
 * @property {string} [sublabel]
 * @property {number} delta
 * @property {ChartPoint[]} trend
 * @property {number} [target]
 */

/**
 * @typedef {Object} OverdueItem
 * @property {string} id
 * @property {string} borrower
 * @property {number} daysOverdue
 * @property {string} owner
 * @property {'low'|'medium'|'high'} severity
 */

/**
 * @typedef {Object} Filters
 * @property {string} [q]
 * @property {string|null} [product]
 * @property {string|null} [owner]
 * @property {string[]} [status]
 * @property {string|null} [dateFrom]
 * @property {string|null} [dateTo]
 * @property {boolean} [compare]
 */
