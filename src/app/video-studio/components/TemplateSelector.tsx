import { RenderTemplate } from '../types';
import { templates } from '../data/templates';

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}

export default function TemplateSelector({ selectedTemplate, onTemplateChange }: TemplateSelectorProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        🎨 템플릿
      </h2>
      
      {/* 쉐도잉 카테고리 */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">🎯 쉐도잉 연습</h3>
        <div className="space-y-2">
          {templates.filter(t => t.category === 'shadowing').map(template => (
            <label key={template.id} className="flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selectedTemplate === template.id}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
                <div className="text-xs text-blue-600">{template.resolution}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 쇼츠 카테고리 */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">📱 쇼츠/릴스</h3>
        <div className="space-y-2">
          {templates.filter(t => t.category === 'shorts').map(template => (
            <label key={template.id} className="flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="template"
                value={template.id}
                checked={selectedTemplate === template.id}
                onChange={(e) => onTemplateChange(e.target.value)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
                <div className="text-xs text-blue-600">{template.resolution}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
