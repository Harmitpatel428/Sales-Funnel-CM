'use client';

import React, { useEffect, useRef, useCallback } from 'react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Size classes for modal width
const getSizeClass = (size: string) => {
  const sizeClasses = {
    sm: 'w-96',
    md: 'w-1/2',
    lg: 'w-3/4',
    xl: 'w-5/6',
    full: 'w-11/12'
  };
  return sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
};

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md'
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal
      modalRef.current.focus();
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Restore body scrolling
        document.body.style.overflow = 'unset';
        
        // Return focus to previously focused element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
    
    return () => {
      // Cleanup function for when modal is not open
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
    
    return () => {
      // Cleanup function for when modal is not open
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Focus trap
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!isOpen || event.key !== 'Tab') return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleTabKey);
      return () => {
        document.removeEventListener('keydown', handleTabKey);
      };
    }
    
    return () => {
      // Cleanup function for when modal is not open
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, handleTabKey]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={`relative top-5 mx-auto p-2 border ${getSizeClass(size)} shadow-lg rounded-md bg-white`}>
        <div className="mt-1">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-2">
            <h3 id="modal-title" className="text-xs font-medium text-black">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors"
              title="Close modal"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div 
            ref={modalRef}
            className={`space-y-2 ${className}`}
            tabIndex={-1}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
