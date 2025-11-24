import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { timelineTemplates, templateCategories } from '../data/timelineTemplates';

const TemplatesModal = ({ onClose, onSelectTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState('All Templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  const filteredTemplates = selectedCategory === 'All Templates'
    ? timelineTemplates
    : timelineTemplates.filter(t => t.category === selectedCategory);

  const selectedTemplate = timelineTemplates.find(t => t.id === selectedTemplateId);

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg border-4 border-black dark:border-white shadow-[8px_8px_0px_#000] dark:shadow-[8px_8px_0px_#FFF] max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b-4 border-black dark:border-white">
          <div className="flex items-center gap-3">
            <FileText size={28} className="text-blue-500" />
            <h2 className="text-2xl font-black font-display">Timeline Templates</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Categories */}
          <div className="w-64 border-r-4 border-black dark:border-white p-4 overflow-y-auto">
            <h3 className="font-bold mb-3 text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              Categories
            </h3>
            <div className="space-y-1">
              {templateCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-400 text-black'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900 border-2 border-blue-400 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200 font-bold">
                💡 Tip: Click a template to preview, then click "Use Template" to start editing
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Template List */}
            <div className="w-80 border-r-4 border-black dark:border-white p-4 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900 shadow-[4px_4px_0px_#3b82f6]'
                        : 'border-black dark:border-white hover:border-blue-400 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#000] dark:hover:shadow-[4px_4px_0px_#FFF]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-bold text-black dark:text-white mb-1">
                          {template.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
              {selectedTemplate ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{selectedTemplate.icon}</span>
                        <div>
                          <h3 className="text-2xl font-black font-display text-black dark:text-white">
                            {selectedTemplate.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedTemplate.category}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white rounded-lg p-6 mb-4">
                    <h4 className="font-bold mb-3 text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      Preview
                    </h4>
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                      {selectedTemplate.content}
                    </pre>
                  </div>

                  {/* Use Template Button */}
                  <button
                    onClick={handleUseTemplate}
                    className="w-full py-3 px-6 border-2 border-black dark:border-white font-bold rounded-lg bg-blue-400 text-black hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] dark:hover:shadow-[6px_6px_0px_#FFF] transition-all"
                  >
                    Use This Template
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-bold">Select a template to preview</p>
                    <p className="text-sm">Choose from {filteredTemplates.length} templates on the left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
