import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect clicks outside of a specified element
 * @param {Function} handler - Callback function to execute when click outside is detected
 * @param {boolean} enabled - Whether the hook is enabled
 * @returns {React.RefObject} Ref to attach to the element
 */
export const useClickOutside = (handler, enabled = true) => {
  const ref = useRef();

  useEffect(() => {
    if (!enabled) return;

    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
};

export default useClickOutside;
