/* 
reusable card component configured via props to handle styling accents 
(such as priority or header colors), badges, and metadata.
*/

interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'normal' | 'high';
  dueDate?: string;
  accentColor?: string; // Optional custom header/border color
  onClick?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  description,
  priority,
  dueDate,
  accentColor = '#e5e7eb',
  onClick,
}) => {
  // Map priority to clean badge colors
  const priorityStyles = {
    low: 'bg-slate-100 text-slate-700',
    normal: 'bg-blue-50 text-blue-700',
    high: 'bg-rose-50 text-rose-700',
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all cursor-pointer"
      style={{ borderLeft: `4px solid ${accentColor}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{title}</h4>
        {priority && (
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full capitalize ${priorityStyles[priority]}`}>
            {priority}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{description}</p>
      )}

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
        {dueDate && <span>Due: {dueDate}</span>}
      </div>
    </div>
  );
};