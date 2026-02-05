import React from 'react';

interface AvatarProps {
  name: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, color = '#1A73E8', size = 'md', className = '' }) => {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold text-white shadow-sm ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
};
