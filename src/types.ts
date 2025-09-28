export interface Project {
  id: string;
  name: string;
  referenceCode: string;
  auditDate: string;
  location: string;
  client: string;
  auditorName: string;
  createdAt: string;
  status: 'draft' | 'in-progress' | 'completed';
  issues: Issue[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  type: 'issue' | 'information';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  assignedTo: string;
  completed: boolean;
  signedOff: boolean;
  signOffDate?: string;
  signOffBy?: string;
  signOffNotes?: string;
  signOffPhoto?: {
    id: string;
    url: string;
    fileName: string;
    uploadDate: string;
  };
  order: number;
  photos: Photo[];
}

export interface Photo {
  id: string;
  url: string;
  fileName: string;
  order: number;
  annotations?: Annotation[];
  uploadDate: string;
}

export interface Annotation {
  id: string;
  type: 'drawing' | 'text' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color: string;
  data?: any;
}

export interface Settings {
  companyName: string;
  companyLogo?: string;
  preparedForLabel: string;
  assignedToLabel: string;
  issueLabel: string;
  issuesLabel: string;
  reportFooter: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  points: DrawingPoint[];
  color: string;
  size: number;
}

export interface TextAnnotation {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}