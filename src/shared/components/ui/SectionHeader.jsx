import React, { memo, forwardRef, useId } from 'react';
import PropTypes from 'prop-types';
import { FiPlus, FiChevronLeft } from 'react-icons/fi';

const cn = (...c) => c.filter(Boolean).join(' ');

const SectionHeader = memo(
  forwardRef(function SectionHeader(
    {
      as: As = 'header',
      title = '',
      description = '',
      buttonText = 'Add',
      onButtonClick,
      showButton = true,
      buttonIcon: ButtonIcon = FiPlus,
      actions,
      children,
      className = '',
      onBack, // optional back action
      backLabel = 'Back',
      breadcrumbs, // [{label, href?}]
      size = 'md', // 'sm' | 'md' | 'lg'
      buttonProps,
      testId,
    },
    ref,
  ) {
    const titleId = useId();
    const descId = useId();

    const paddings =
      size === 'sm' ? 'px-3 py-3' : size === 'lg' ? 'px-6 py-6' : 'px-4 py-4';
    const titleSize =
      size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-3xl' : 'text-2xl';

    const showPrimaryButton = showButton && !actions && buttonText && typeof onButtonClick === 'function';

    return (
      <As
        ref={ref}
        className={cn('bg-white border-b border-gray-100', paddings, className)}
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        data-testid={testId}
      >
        <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {typeof onBack === 'function' && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex shrink-0 items-center justify-center h-9 w-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                aria-label={backLabel}
              >
                <FiChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
            )}
            <div>
              {breadcrumbs?.length ? (
                <nav aria-label="Breadcrumb" className="mb-1">
                  <ol className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                    {breadcrumbs.map((b, i) => (
                      <li key={`${b.label}-${i}`} className="flex items-center gap-1">
                        {i > 0 && <span aria-hidden="true">/</span>}
                        {b.href ? (
                          <a href={b.href} className="hover:text-gray-700">
                            {b.label}
                          </a>
                        ) : (
                          <span className="text-gray-700">{b.label}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                </nav>
              ) : null}

              {title ? (
                <h1 id={titleId} className={cn(titleSize, 'font-bold text-gray-900')}>
                  {title}
                </h1>
              ) : null}
              {description ? (
                <p id={descId} className="mt-0.5 text-sm text-gray-600">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions ? (
              actions
            ) : (
              showPrimaryButton && (
                <button
                  type="button"
                  onClick={onButtonClick}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#01818E] to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:from-[#01818E]/90 hover:to-cyan-600/90 focus:outline-none focus:ring-2 focus:ring-[#01818E]/30 disabled:opacity-60"
                  aria-label={buttonText}
                  {...buttonProps}
                >
                  <ButtonIcon className="h-4 w-4" />
                  <span>{buttonText}</span>
                </button>
              )
            )}
          </div>
        </div>

        {children ? <div className="mt-2">{children}</div> : null}
      </As>
    );
  }),
);

SectionHeader.propTypes = {
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
  title: PropTypes.string,
  description: PropTypes.string,
  buttonText: PropTypes.string,
  onButtonClick: PropTypes.func,
  showButton: PropTypes.bool,
  buttonIcon: PropTypes.elementType,
  actions: PropTypes.node,
  children: PropTypes.node,
  className: PropTypes.string,
  onBack: PropTypes.func,
  backLabel: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({ label: PropTypes.string.isRequired, href: PropTypes.string }),
  ),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  buttonProps: PropTypes.object,
  testId: PropTypes.string,
};

export default SectionHeader;
