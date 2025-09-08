import { FolderOpen } from 'lucide-react';

const DocumentChecklist = ({ documents = [], accentColor = '#01818E' }) => {

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'REQUIRED':
        return {
          backgroundColor: `${accentColor}1A`,
          color: accentColor,
          border: `1px solid ${accentColor}`,
        };
      case 'RECEIVED':
        return {
          backgroundColor: accentColor,
          color: '#ffffff',
          border: `1px solid ${accentColor}`,
        };
      case 'PENDING':
        return {
          backgroundColor: '#fef3c7',
          color: '#92400e',
          border: '1px solid #facc15',
        };
      default:
        return {
          backgroundColor: '#e5e7eb',
          color: '#1f2937',
          border: '1px solid #d1d5db',
        };
    }
  };

  return (
    <div className="w-full rounded-2xl shadow-md border border-gray-200 bg-white overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-5 pb-2">
        <FolderOpen className="w-5 h-5 text-yellow-600" />
        <h2 className="text-sm font-bold tracking-wide text-gray-800">
          Documentation Checklist
        </h2>
      </div>

      {/* Table Head */}
      <div className="grid grid-cols-3 px-5 py-2 text-xs font-semibold uppercase tracking-wider border-t border-b bg-gray-100 border-gray-200 text-gray-700">
        <span>Status</span>
        <span>Document</span>
        <span className="text-right">Date</span>
      </div>

      {/* Table Body */}
      {documents.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-6 italic">No documents listed.</div>
      ) : (
        documents.map((doc, i) => (
          <div
            key={i}
            className="grid grid-cols-3 items-center px-5 py-3 text-sm border-t border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {/* Checkbox + Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked={doc.checked}
                className="w-4 h-4"
                style={{ accentColor }}
              />
              <span
                className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full"
                style={getStatusBadgeStyle(doc.status)}
              >
                {doc.status}
              </span>
            </div>

            {/* Document Name */}
            <div className="truncate max-w-[160px]">
              <a
                href="#"
                className="underline text-blue-600 hover:text-blue-800"
              >
                {doc.name}
              </a>
            </div>

            {/* Date */}
            <span className="text-xs text-right text-gray-500">
              {doc.date}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default DocumentChecklist;
