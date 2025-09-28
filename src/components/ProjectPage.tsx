import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Camera, FileText, BarChart3, Settings2, Filter, UserCheck } from 'lucide-react';
import { Project, Issue } from '../types';
import { storage } from '../utils/storage';
import { IssueCard } from './IssueCard';
import { PhotoUpload } from './PhotoUpload';
import { BulkAssignModal } from './BulkAssignModal';
import { ReportGenerator } from './ReportGenerator';

interface ProjectPageProps {
  projectId: string;
  onBack: () => void;
  onAnnotatePhoto: (projectId: string, issueId: string, photoId: string) => void;
  onOpenSettings: () => void;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({ 
  projectId, 
  onBack, 
  onAnnotatePhoto,
  onOpenSettings 
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadProject = () => {
      const proj = storage.getProject(projectId);
      if (proj) {
        // Sort issues by order
        proj.issues.sort((a, b) => a.order - b.order);
        setProject(proj);
      }
    };
    loadProject();
  }, [projectId]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Project not found</p>
          <button onClick={onBack} className="mt-2 text-green-600 hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProject = (updatedProject: Project) => {
    storage.saveProject(updatedProject);
    setProject(updatedProject);
  };

  const handleUpdateProjectStatus = (newStatus: 'draft' | 'in-progress' | 'completed') => {
    const updatedProject = {
      ...project,
      status: newStatus
    };
    handleSaveProject(updatedProject);
  };

  const handleCreateIssue = (photos: Array<{ file: File; url: string }>) => {
    const newIssue: Issue = {
      id: Date.now().toString(),
      title: 'New Issue',
      description: '',
      type: 'issue',
      priority: 'medium',
      location: '',
      assignedTo: '',
      completed: false,
      signedOff: false,
      order: project.issues.length + 1,
      photos: photos.map((photo, index) => ({
        id: `${Date.now()}-${index}`,
        url: photo.url,
        fileName: photo.file.name,
        order: index + 1,
        uploadDate: new Date().toISOString()
      }))
    };

    const updatedProject = {
      ...project,
      issues: [...project.issues, newIssue]
    };

    handleSaveProject(updatedProject);
    setShowPhotoUpload(false);
  };

  const handleUpdateIssue = (updatedIssue: Issue) => {
    const updatedProject = {
      ...project,
      issues: project.issues.map(issue => 
        issue.id === updatedIssue.id ? updatedIssue : issue
      )
    };
    handleSaveProject(updatedProject);
  };

  const handleDeleteIssue = (issueId: string) => {
    const updatedProject = {
      ...project,
      issues: project.issues.filter(issue => issue.id !== issueId)
    };
    handleSaveProject(updatedProject);
  };

  const handleBulkAssign = (assignee: string) => {
    const updatedProject = {
      ...project,
      issues: project.issues.map(issue => ({ ...issue, assignedTo: assignee }))
    };
    handleSaveProject(updatedProject);
    setShowBulkAssign(false);
  };

  const getUniqueAssignees = () => {
    const assignees = new Set(project.issues.map(issue => issue.assignedTo).filter(Boolean));
    return Array.from(assignees);
  };

  const filteredIssues = project.issues.filter(issue => {
    const matchesAssignee = assigneeFilter === 'all' || issue.assignedTo === assigneeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'completed' && issue.completed) ||
                         (statusFilter === 'pending' && !issue.completed);
    return matchesAssignee && matchesStatus;
  });

  const totalPhotos = project.issues.reduce((acc, issue) => acc + issue.photos.length, 0);
  const criticalIssues = project.issues.filter(issue => issue.priority === 'critical').length;
  const highPriorityIssues = project.issues.filter(issue => issue.priority === 'high').length;
  const completedIssues = project.issues.filter(issue => issue.completed).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span>{new Date(project.auditDate).toLocaleDateString()}</span>
                <select
                  value={project.status}
                  onChange={(e) => handleUpdateProjectStatus(e.target.value as any)}
                  className="capitalize bg-transparent border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-green-500"
                >
                  <option value="draft">Draft</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Project Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Location</div>
              <div className="font-semibold text-green-800">{project.location}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Audit Date</div>
              <div className="font-semibold text-blue-800">
                {new Date(project.auditDate).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Photos Captured</div>
              <div className="font-semibold text-purple-800">{totalPhotos} photos</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="font-semibold text-orange-800">
                {completedIssues}/{project.issues.length} complete
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Photos
            </button>
            <button
              onClick={() => setShowBulkAssign(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <UserCheck size={16} />
              Bulk Assign
            </button>
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Settings2 size={16} />
              Settings
            </button>
            <button
              onClick={() => setShowReportGenerator(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FileText size={16} />
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
            </div>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Assignees</option>
              <option value="">Unassigned</option>
              {getUniqueAssignees().map(assignee => (
                <option key={assignee} value={assignee}>{assignee}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Issues ({filteredIssues.length})
            {criticalIssues > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                {criticalIssues} Critical
              </span>
            )}
            {highPriorityIssues > 0 && (
              <span className="ml-2 px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                {highPriorityIssues} High Priority
              </span>
            )}
          </h2>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <Camera size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500 mb-4">Start by adding photos to document issues.</p>
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Add Photos
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onUpdate={handleUpdateIssue}
                onDelete={handleDeleteIssue}
                onAnnotatePhoto={(photoId) => onAnnotatePhoto(projectId, issue.id, photoId)}
              />
            ))}
          </div>
        )}
      </div>

      {showPhotoUpload && (
        <PhotoUpload
          onClose={() => setShowPhotoUpload(false)}
          onUpload={handleCreateIssue}
        />
      )}

      {showBulkAssign && (
        <BulkAssignModal
          existingAssignees={getUniqueAssignees()}
          onClose={() => setShowBulkAssign(false)}
          onAssign={handleBulkAssign}
        />
      )}

      {showReportGenerator && (
        <ReportGenerator
          project={project}
          onClose={() => setShowReportGenerator(false)}
        />
      )}
    </div>
  );
};