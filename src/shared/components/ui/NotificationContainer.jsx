// ========================================
// 🔔 NOTIFICATION CONTAINER
// ========================================
// Professional notification container with animations and positioning
// Features:
// - Professional design matching modern dashboard aesthetics
// - Smooth animations with Framer Motion
// - Multiple position support
// - Auto-positioning based on screen size
// - Professional icons and styling
// ========================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import NotificationItem from './NotificationItem';
import { NOTIFICATION_POSITIONS } from '@constants/notifications';

// ========================================
// 🎯 POSITION STYLES
// ========================================

const getPositionStyles = (position) => {
  const base = 'fixed z-50 flex flex-col gap-3 p-4 pointer-events-none';

  const positions = {
    [NOTIFICATION_POSITIONS.TOP_RIGHT]: `${base} top-0 right-0 items-end`,
    [NOTIFICATION_POSITIONS.TOP_LEFT]: `${base} top-0 left-0 items-start`,
    [NOTIFICATION_POSITIONS.TOP_CENTER]: `${base} top-0 left-1/2 transform -translate-x-1/2 items-center`,
    [NOTIFICATION_POSITIONS.BOTTOM_RIGHT]: `${base} bottom-0 right-0 items-end`,
    [NOTIFICATION_POSITIONS.BOTTOM_LEFT]: `${base} bottom-0 left-0 items-start`,
    [NOTIFICATION_POSITIONS.BOTTOM_CENTER]: `${base} bottom-0 left-1/2 transform -translate-x-1/2 items-center`,
  };

  return positions[position] || positions[NOTIFICATION_POSITIONS.TOP_RIGHT];
};

// ========================================
// 🎯 ANIMATION VARIANTS
// ========================================

const getItemVariants = (position) => {
  const isTop = position.includes('top');
  const isRight = position.includes('right');
  const isLeft = position.includes('left');
  const isCenter = position.includes('center');

  let x = 0;
  const y = isTop ? -100 : 100;

  if (isRight) x = 100;
  if (isLeft) x = -100;
  if (isCenter) x = 0;

  return {
    initial: {
      opacity: 0,
      x,
      y,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      x,
      y: y * 0.5,
      scale: 0.8,
      transition: {
        duration: 0.2,
      },
    },
  };
};

// ========================================
// 🎯 NOTIFICATION CONTAINER COMPONENT
// ========================================

const NotificationContainer = ({
  notifications = [],
  position = NOTIFICATION_POSITIONS.TOP_RIGHT,
  onRemove,
}) => {
  const itemVariants = getItemVariants(position);

  // Don't render if no notifications
  if (!notifications.length) return null;

  const containerContent = (
    <div className={getPositionStyles(position)}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            layout
            variants={itemVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pointer-events-auto"
          >
            <NotificationItem
              notification={notification}
              onRemove={onRemove}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  // Render in portal to ensure proper z-index stacking
  return createPortal(
    containerContent,
    document.body,
  );
};

export default NotificationContainer;
