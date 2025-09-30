import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  elevation = 'medium',
  hover = false 
}) => {
  const elevationClasses = {
    none: '',
    low: 'shadow-elevation-1',
    medium: 'shadow-elevation-2',
    high: 'shadow-elevation-3',
  };

  const hoverClasses = hover ? 'hover:shadow-elevation-4 hover:-translate-y-1' : '';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${elevationClasses[elevation]} ${hoverClasses} ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;