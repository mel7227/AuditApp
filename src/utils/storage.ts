import { Project, Settings } from '../types';

const PROJECTS_KEY = 'audit_projects';
const SETTINGS_KEY = 'audit_settings';

export const storage = {
  getProjects(): Project[] {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveProject(project: Project): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  deleteProject(projectId: string): void {
    const projects = this.getProjects().filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  getProject(projectId: string): Project | undefined {
    return this.getProjects().find(p => p.id === projectId);
  },

  getSettings(): Settings {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      companyName: 'Site Audit Manager',
      preparedForLabel: 'Prepared For',
      assignedToLabel: 'Assigned To',
      issueLabel: 'Issue',
      issuesLabel: 'Issues',
      reportFooter: 'Professional Audit Report'
    };
  },

  saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};