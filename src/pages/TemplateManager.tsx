import { useState } from 'react';
import { TemplateManager as TemplateManagerComponent } from '@/components/template/TemplateManager';

const TemplateManager = () => {
  return (
    <div className="flex h-screen bg-chatgpt-main">
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              <TemplateManagerComponent />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TemplateManager;