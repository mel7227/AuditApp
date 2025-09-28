import React, { useState, useRef, useEffect } from 'react';
import { X, Edit2, Download, Undo, Trash, Palette, Type, Save } from 'lucide-react';
import { Project, Issue, Photo, DrawingPath, TextAnnotation } from '../types';
import { storage } from '../utils/storage';

interface AnnotatePictureProps {
  projectId: string;
  issueId: string;
  photoId: string;
  onClose: () => void;
}

export const AnnotatePicture: React.FC<AnnotatePictureProps> = ({
  projectId,
  issueId,
  photoId,
  onClose
}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [issue, setIssue] = useState<Issue | null>(null);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<DrawingPath | null>(null);
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(5);
  const [mode, setMode] = useState<'draw' | 'text'>('draw');
  const [isAddingText, setIsAddingText] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [fontSize, setFontSize] = useState(16);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    location: '',
    type: 'issue' as 'issue' | 'information',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    assignedTo: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = [
    '#ff0000', // Red
    '#0000ff', // Blue
    '#ffff00', // Yellow
    '#000000', // Black
    '#00ff00', // Green
    '#ff8800', // Orange
    '#ff00ff', // Magenta
    '#ffffff'  // White
  ];

  useEffect(() => {
    const proj = storage.getProject(projectId);
    if (proj) {
      setProject(proj);
      const iss = proj.issues.find(i => i.id === issueId);
      if (iss) {
        setIssue(iss);
        setEditData({
          title: iss.title,
          description: iss.description,
          location: iss.location,
          type: iss.type,
          priority: iss.priority,
          assignedTo: iss.assignedTo
        });
        const ph = iss.photos.find(p => p.id === photoId);
        if (ph) {
          setPhoto(ph);
          // Load existing annotations
          if (ph.annotations) {
            const drawingPaths = ph.annotations
              .filter(a => a.type === 'drawing')
              .map(a => a.data as DrawingPath);
            setPaths(drawingPaths);
            
            const textAnns = ph.annotations
              .filter(a => a.type === 'text')
              .map(a => ({
                id: a.id,
                x: a.x,
                y: a.y,
                text: a.text || '',
                fontSize: a.fontSize || 16,
                color: a.color
              }));
            setTextAnnotations(textAnns);
          }
        }
      }
    }
  }, [projectId, issueId, photoId]);

  useEffect(() => {
    if (photo && imageRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const image = imageRef.current;

      const resizeCanvas = () => {
        const rect = image.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        redrawCanvas();
      };

      image.onload = resizeCanvas;
      window.addEventListener('resize', resizeCanvas);
      
      // Initial resize
      if (image.complete) {
        resizeCanvas();
      }

      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [photo, paths, textAnnotations]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all paths
    paths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      
      ctx.stroke();
    });

    // Draw current path
    if (currentPath && currentPath.points.length > 0) {
      ctx.strokeStyle = currentPath.color;
      ctx.lineWidth = currentPath.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentPath.points[0].x, currentPath.points[0].y);
      
      for (let i = 1; i < currentPath.points.length; i++) {
        ctx.lineTo(currentPath.points[i].x, currentPath.points[i].y);
      }
      
      ctx.stroke();
    }

    // Draw text annotations
    textAnnotations.forEach(textAnn => {
      ctx.fillStyle = textAnn.color;
      ctx.font = `${textAnn.fontSize}px Arial`;
      ctx.fillText(textAnn.text, textAnn.x, textAnn.y);
    });
  };

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (pos: { x: number; y: number }) => {
    if (mode !== 'draw') return;
    
    setIsDrawing(true);
    const newPath: DrawingPath = {
      points: [pos],
      color: selectedColor,
      size: brushSize
    };
    setCurrentPath(newPath);
  };

  const draw = (pos: { x: number; y: number }) => {
    if (!isDrawing || !currentPath || mode !== 'draw') return;

    const updatedPath = {
      ...currentPath,
      points: [...currentPath.points, pos]
    };
    setCurrentPath(updatedPath);
  };

  const stopDrawing = () => {
    if (currentPath && currentPath.points.length > 0) {
      setPaths(prev => [...prev, currentPath]);
    }
    setIsDrawing(false);
    setCurrentPath(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (mode === 'text' && !isAddingText) {
      const pos = getCanvasCoordinates(e);
      setTextPosition(pos);
      setIsAddingText(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'draw') {
      startDrawing(getCanvasCoordinates(e));
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDrawing && mode === 'draw') {
      draw(getCanvasCoordinates(e));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'draw') {
      stopDrawing();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (mode === 'draw') {
      startDrawing(getCanvasCoordinates(e));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDrawing && mode === 'draw') {
      draw(getCanvasCoordinates(e));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (mode === 'draw') {
      stopDrawing();
    }
  };

  const addTextAnnotation = () => {
    if (!textPosition || !textInput.trim()) return;

    const newTextAnnotation: TextAnnotation = {
      id: Date.now().toString(),
      x: textPosition.x,
      y: textPosition.y,
      text: textInput.trim(),
      fontSize: fontSize,
      color: selectedColor
    };

    setTextAnnotations(prev => [...prev, newTextAnnotation]);
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
  };

  const cancelTextInput = () => {
    setTextInput('');
    setTextPosition(null);
    setIsAddingText(false);
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      setPaths(prev => prev.slice(0, -1));
    } else if (textAnnotations.length > 0) {
      setTextAnnotations(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setPaths([]);
    setTextAnnotations([]);
    setCurrentPath(null);
  };

  const saveAnnotations = () => {
    if (!project || !issue || !photo) return;

    const annotations = [
      ...paths.map((path, index) => ({
        id: `path-${index}`,
        type: 'drawing' as const,
        x: 0,
        y: 0,
        color: path.color,
        data: path
      })),
      ...textAnnotations.map(textAnn => ({
        id: textAnn.id,
        type: 'text' as const,
        x: textAnn.x,
        y: textAnn.y,
        text: textAnn.text,
        fontSize: textAnn.fontSize,
        color: textAnn.color
      }))
    ];

    const updatedPhoto = {
      ...photo,
      annotations
    };

    const updatedIssue = {
      ...issue,
      ...editData,
      photos: issue.photos.map(p => p.id === photoId ? updatedPhoto : p)
    };

    const updatedProject = {
      ...project,
      issues: project.issues.map(i => i.id === issueId ? updatedIssue : i)
    };

    storage.saveProject(updatedProject);
    
    // Update local state to reflect changes
    setProject(updatedProject);
    setIssue(updatedIssue);
    setPhoto(updatedPhoto);
    
    onClose();
  };

  const handleDownload = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;

    if (!ctx) return;

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Draw the original image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Scale factors
    const scaleX = canvas.width / image.offsetWidth;
    const scaleY = canvas.height / image.offsetHeight;

    // Draw paths
    paths.forEach(path => {
      if (path.points.length < 2) return;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size * Math.max(scaleX, scaleY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      const firstPoint = path.points[0];
      ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);
      
      for (let i = 1; i < path.points.length; i++) {
        const point = path.points[i];
        ctx.lineTo(point.x * scaleX, point.y * scaleY);
      }
      
      ctx.stroke();
    });

    // Draw text annotations
    textAnnotations.forEach(textAnn => {
      ctx.fillStyle = textAnn.color;
      ctx.font = `${textAnn.fontSize * Math.max(scaleX, scaleY)}px Arial`;
      ctx.fillText(textAnn.text, textAnn.x * scaleX, textAnn.y * scaleY);
    });

    // Download
    const link = document.createElement('a');
    link.download = `annotated-${photo?.fileName || 'image.png'}`;
    link.href = canvas.toDataURL();
    link.click();
  };

  useEffect(() => {
    redrawCanvas();
  }, [paths, currentPath, textAnnotations]);

  if (!photo || !issue) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="flex h-full">
        {/* Image Panel */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <div className="flex items-center justify-between p-4 bg-gray-800">
            <h2 className="text-white font-semibold">Annotate Picture</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
            <div ref={containerRef} className="relative max-w-full max-h-full">
              <img
                ref={imageRef}
                src={photo.url}
                alt={photo.fileName}
                className="max-w-full max-h-full object-contain"
                style={{ display: 'block' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
                style={{ 
                  cursor: mode === 'draw' ? 'crosshair' : mode === 'text' ? 'text' : 'default',
                  touchAction: 'none'
                }}
                onClick={handleCanvasClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="bg-gray-800 p-4">
            <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
              {/* Mode Selection */}
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('draw')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    mode === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    mode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Type size={16} />
                </button>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-2">
                <Palette size={16} className="text-white" />
                <div className="flex gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded border-2 ${
                        selectedColor === color ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Size Controls */}
              {mode === 'draw' && (
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Size:</span>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-white text-sm w-6">{brushSize}px</span>
                </div>
              )}

              {mode === 'text' && (
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">Font Size:</span>
                  <input
                    type="range"
                    min="12"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-white text-sm w-8">{fontSize}px</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={paths.length === 0 && textAnnotations.length === 0}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Undo size={16} />
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash size={16} />
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>

            {/* Text Input Modal */}
            {isAddingText && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Type size={16} className="text-white" />
                  <span className="text-white text-sm">Add Text</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter text..."
                    className="flex-1 px-3 py-2 bg-gray-600 text-white rounded border-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && addTextAnnotation()}
                  />
                  <button
                    onClick={addTextAnnotation}
                    disabled={!textInput.trim()}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded transition-colors"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={cancelTextInput}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-80 bg-white flex flex-col">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Edit2 size={20} className="text-green-600" />
              <h3 className="font-semibold text-gray-900">Issue Details</h3>
            </div>

            {/* Picture Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Picture Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="issue"
                    checked={editData.type === 'issue'}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                    className="mr-2"
                  />
                  Issue
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="information"
                    checked={editData.type === 'information'}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value as any })}
                    className="mr-2"
                  />
                  Information
                </label>
              </div>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Location Detail */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Location Detail</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Assigned To */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <input
                type="text"
                value={editData.assignedTo}
                onChange={(e) => setEditData({ ...editData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="mt-auto p-6 border-t">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAnnotations}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};