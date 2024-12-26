import React from 'react';
import { logger, LogCategory } from '@/utils/logging';

interface TemplateHeaderProps {
  onCreateClick: () => void;
}

export const TemplateHeader = ({ onCreateClick }: TemplateHeaderProps) => {
  const handleCreateClick = () => {
    logger.debug(LogCategory.USER_ACTION, 'TemplateHeader', 'Create template clicked');
    onCreateClick();
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Templates</h2>
      <button
        onClick={handleCreateClick}
        className="btn-primary"
      >
        Create Template
      </button>
    </div>
  );
};