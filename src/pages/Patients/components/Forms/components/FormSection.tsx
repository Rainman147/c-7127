import React from 'react';

interface FormSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const FormSection = ({ children, className = '' }: FormSectionProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {children}
    </div>
  );
};