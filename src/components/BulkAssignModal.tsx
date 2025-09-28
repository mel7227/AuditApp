import React, { useState } from 'react';
import { X, UserCheck, Users } from 'lucide-react';

interface BulkAssignModalProps {
  existingAssignees: string[];
  onClose: () => void;
  onAssign: (assignee: string) => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({ 
  existingAssignees, 
  onClose, 
  onAssign 
}) => {
  const [assignee, setAssignee] = useState('');
  const [isNewAssignee, setIsNewAssignee] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assignee.trim()) {
      onAssign(assignee.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Bulk Assign Issues</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-4">
              Assign all issues in this project to the same person. This will override any existing assignments.
            </p>

            <div className="space-y-4">
              {existingAssignees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select existing assignee:
                  </label>
                  <div className="space-y-2">
                    {existingAssignees.map((existing) => (
                      <label key={existing} className="flex items-center">
                        <input
                          type="radio"
                          name="assignee"
                          value={existing}
                          checked={assignee === existing && !isNewAssignee}
                          onChange={(e) => {
                            setAssignee(e.target.value);
                            setIsNewAssignee(false);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{existing}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <label className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="assignee"
                    checked={isNewAssignee}
                    onChange={() => {
                      setIsNewAssignee(true);
                      setAssignee('');
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">New assignee:</span>
                </label>
                <input
                  type="text"
                  value={isNewAssignee ? assignee : ''}
                  onChange={(e) => {
                    setAssignee(e.target.value);
                    setIsNewAssignee(true);
                  }}
                  placeholder="Enter assignee name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!isNewAssignee}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!assignee.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck size={16} />
              Assign All
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};