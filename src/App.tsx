import React, { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ProjectsPage } from './components/ProjectsPage';
import { ProjectPage } from './components/ProjectPage';
import { AnnotatePicture } from './components/AnnotatePicture';
import { SettingsPage } from './components/SettingsPage';

type View = 'projects' | 'project' | 'annotate' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [annotationData, setAnnotationData] = useState<{
    projectId: string;
    issueId: string;
    photoId: string;
  } | null>(null);

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project');
  };

  const handleAnnotatePhoto = (projectId: string, issueId: string, photoId: string) => {
    setAnnotationData({ projectId, issueId, photoId });
    setCurrentView('annotate');
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
    setSelectedProjectId('');
  };

  const handleBackToProject = () => {
    setCurrentView('project');
    setAnnotationData(null);
  };

  const handleOpenSettings = () => {
    setCurrentView('settings');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">Food Factory</h1>
              <p className="text-sm text-gray-600">Audit Manager</p>
            </div>
          </div>
        </div>

        <nav className="px-4">
          <div className="space-y-2">
            <button
              onClick={handleBackToProjects}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                currentView === 'projects' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList size={20} />
              Projects
            </button>
            <button
              onClick={handleOpenSettings}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                currentView === 'settings' 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <ClipboardList size={20} />
              Settings
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {currentView === 'projects' && (
          <ProjectsPage onSelectProject={handleSelectProject} />
        )}

        {currentView === 'project' && selectedProjectId && (
          <ProjectPage
            projectId={selectedProjectId}
            onBack={handleBackToProjects}
            onAnnotatePhoto={handleAnnotatePhoto}
            onOpenSettings={handleOpenSettings}
          />
        )}

        {currentView === 'annotate' && annotationData && (
          <AnnotatePicture
            projectId={annotationData.projectId}
            issueId={annotationData.issueId}
            photoId={annotationData.photoId}
            onClose={handleBackToProject}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPage onBack={handleBackToProjects} />
        )}
      </div>
    </div>
  );
}

export default App;