import { useTemplatesListQuery } from '@/hooks/queries/useTemplateQueries';
import type { Template } from '@/types/template';

const TemplatesListPage = () => {
  const { 
    data: templates = [], 
    isLoading,
    error 
  } = useTemplatesListQuery();

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Templates</h1>
        <p>Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Templates</h1>
        <p className="text-red-500">Error loading templates: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Templates</h1>
      <ul className="space-y-4">
        {templates.map(template => (
          <li key={template.id} className="border rounded-lg p-4 bg-chatgpt-main">
            <h2 className="text-lg font-semibold text-white">{template.name}</h2>
            <p className="text-gray-300 mt-1">{template.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemplatesListPage;