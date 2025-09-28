import React, { useState } from 'react';
import { 
  Edit2, 
  Trash2, 
  Camera, 
  MapPin, 
  User, 
  CheckSquare, 
  Square,
  AlertTriangle,
  Info,
  ChevronUp,
  ChevronDown,
  GripVertical,
  ArrowUp,
  ArrowDown,
  FileCheck
} from 'lucide-react';
import { Issue } from '../types';
import { SignOffModal } from './SignOffModal';

interface IssueCardProps {
  issue: Issue;
  onUpdate: (issue: Issue) => void;
  onDelete: (issueId: string) => void;
  onAnnotatePhoto: (photoId: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export const IssueCard: React.FC<IssueCardProps> = ({ 
  issue, 
  onUpdate, 
  onDelete, 
  onAnnotatePhoto,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(issue);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSignOffModal, setShowSignOffModal] = useState(false);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(issue);
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    const updated = { ...issue, completed: !issue.completed };
    if (updated.completed) {
      updated.signedOff = false; // Reset sign-off when toggling completion
    }
    onUpdate(updated);
  };

  const handleSignOff = (signOffData: {
    notes: string;
    photo?: {
      id: string;
      url: string;
      fileName: string;
      uploadDate: string;
    };
  }) => {
    const isRemoving = !signOffData.notes && !signOffData.photo;
    
    const updated = {
      ...issue,
      signedOff: !isRemoving,
      signOffDate: !isRemoving ? new Date().toISOString() : undefined,
      signOffBy: !isRemoving ? 'Current User' : undefined,
      signOffNotes: signOffData.notes || undefined,
      signOffPhoto: signOffData.photo || undefined
    };
    
    onUpdate(updated);
    setShowSignOffModal(false);
  };

  const handleOrderChange = (newOrder: number) => {
    const updated = { ...issue, order: newOrder };
    onUpdate(updated);
  };
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'issue' ? 
      <AlertTriangle size={16} className="text-orange-600" /> : 
      <Info size={16} className="text-blue-600" />;
  };

  return (
    <>
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <GripVertical size={16} className="text-gray-400 cursor-move" />
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <input
                    type="number"
                    value={editData.order}
                    onChange={(e) => setEditData({ ...editData, order: parseInt(e.target.value) || 1 })}
                    className="w-12 px-1 py-0 text-xs border border-gray-300 rounded"
                    min="1"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-500">#{issue.order}</span>
                )}
                <div className="flex flex-col">
                  <button
                    onClick={onMoveUp}
                    disabled={!canMoveUp}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={onMoveDown}
                    disabled={!canMoveDown}
                    className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>
              </div>
            </div>
            {getTypeIcon(issue.type)}
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full font-semibold text-lg border-none bg-transparent focus:ring-0 p-0"
                />
              ) : (
                <h3 className="font-semibold text-lg text-gray-900">{issue.title}</h3>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(issue.priority)}`}>
              {issue.priority}
            </span>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleToggleComplete}
              className={`p-2 rounded-lg transition-colors ${
                issue.completed 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {issue.completed ? <CheckSquare size={16} /> : <Square size={16} />}
            </button>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => onDelete(issue.id)}
                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            {isEditing ? (
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                placeholder="Location"
                className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
              />
            ) : (
              <span className="text-sm text-gray-600">{issue.location || 'No location'}</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            {isEditing ? (
              <input
                type="text"
                value={editData.assignedTo}
                onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                placeholder="Assigned to"
                className="flex-1 text-sm border-gray-300 rounded px-2 py-1"
              />
            ) : (
              <span className="text-sm text-gray-600">{issue.assignedTo || 'Unassigned'}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Camera size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">{issue.photos.length} photos</span>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              {isEditing ? (
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full border-gray-300 rounded-md"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600 text-sm">
                  {issue.description || 'No description provided'}
                </p>
              )}
            </div>

            {/* Priority and Type Selection */}
            {isEditing && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                    className="w-full border-gray-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                    className="w-full border-gray-300 rounded-md"
                  >
                    <option value="issue">Issue</option>
                    <option value="information">Information</option>
                  </select>
                </div>
              </div>
            )}

            {/* Sign-off Section */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Sign-off Status</h4>
                  <p className="text-sm text-gray-600">
                    {issue.signedOff 
                      ? `Signed off on ${new Date(issue.signOffDate!).toLocaleDateString()}`
                      : 'Awaiting sign-off'
                    }
                  </p>
                </div>
                <button
                  onClick={handleSignOff}
                  disabled={!issue.completed}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    issue.completed
                      ? issue.signedOff
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {issue.signedOff ? 'Remove Sign-off' : 'Sign Off'}
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            {issue.photos.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Photos ({issue.photos.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {issue.photos
                    .sort((a, b) => a.order - b.order)
                    .map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        #{photo.order}
                      </div>
                      <button
                        onClick={() => onAnnotatePhoto(photo.id)}
                        className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                      >
                        <Edit2 size={20} className="text-white" />
                      </button>
                      {photo.annotations && photo.annotations.length > 0 && (
                        <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                          Annotated
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    
    {showSignOffModal && (
      <SignOffModal
        issue={issue}
        onClose={() => setShowSignOffModal(false)}
        onSignOff={handleSignOff}
      />
    )}
    </>
  );
};