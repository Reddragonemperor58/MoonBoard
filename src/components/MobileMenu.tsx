import React, { useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
}

type DragType = boolean | 'x' | 'y' | undefined;

const POSITIONS = {
  left: {
    menu: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    drag: 'x' as DragType,
    dragConstraints: { left: 0, right: 0 },
    dragThreshold: -50,
  },
  right: {
    menu: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
    drag: 'x' as DragType,
    dragConstraints: { left: 0, right: 0 },
    dragThreshold: 50,
  },
  bottom: {
    menu: {
      initial: { y: '100%' },
      animate: { y: 0 },
      exit: { y: '100%' },
    },
    drag: 'y' as DragType,
    dragConstraints: { top: 0, bottom: 0 },
    dragThreshold: 50,
  },
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  children,
  position = 'bottom',
}) => {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = POSITIONS[position].dragThreshold;
    const offset = position === 'bottom' ? info.offset.y : info.offset.x;

    if (offset > threshold) {
      onClose();
    }
  };

  const positionClasses = {
    left: 'left-0 top-0 h-full max-w-[80vw]',
    right: 'right-0 top-0 h-full max-w-[80vw]',
    bottom: 'bottom-0 left-0 right-0 max-h-[80vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={handleBackdropClick}
            role="presentation"
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Mobile menu"
            initial={POSITIONS[position].menu.initial}
            animate={POSITIONS[position].menu.animate}
            exit={POSITIONS[position].menu.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed ${positionClasses[position]} bg-white dark:bg-gray-800 shadow-lg z-50 rounded-t-xl p-4`}
            drag={POSITIONS[position].drag}
            dragConstraints={POSITIONS[position].dragConstraints}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-manipulation"
              aria-label="Close menu"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Content with improved touch target spacing */}
            <div className="mt-2 space-y-6 overflow-y-auto max-h-[calc(80vh-4rem)] touch-manipulation">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
