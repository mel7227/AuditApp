import React, { useState } from 'react';
import { X, Download, FileText, Filter, User } from 'lucide-react';
import { Project, Issue, Settings } from '../types';
import { storage } from '../utils/storage';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportGeneratorProps {
  project: Project;
  onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ project, onClose }) => {
  const [settings] = useState<Settings>(storage.getSettings());
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const getUniqueAssignees = () => {
    const assignees = new Set(project.issues.map(issue => issue.assignedTo).filter(Boolean));
    return Array.from(assignees);
  };

  const getFilteredIssues = (): Issue[] => {
    return project.issues.filter(issue => {
      const matchesAssignee = selectedAssignee === 'all' || issue.assignedTo === selectedAssignee;
      const matchesStatus = (includeCompleted && issue.completed) || (includePending && !issue.completed);
      return matchesAssignee && matchesStatus;
    }).sort((a, b) => a.order - b.order);
  };

  const createAnnotatedImage = async (photo: any): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Draw annotations if they exist
        if (photo.annotations) {
          photo.annotations.forEach((annotation: any) => {
            if (annotation.type === 'drawing' && annotation.data) {
              const path = annotation.data;
              if (path.points && path.points.length > 1) {
                ctx.strokeStyle = path.color;
                ctx.lineWidth = path.size * 2; // Scale up for better visibility
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';

                ctx.beginPath();
                ctx.moveTo(path.points[0].x * (canvas.width / 800), path.points[0].y * (canvas.height / 600));
                
                for (let i = 1; i < path.points.length; i++) {
                  ctx.lineTo(path.points[i].x * (canvas.width / 800), path.points[i].y * (canvas.height / 600));
                }
                
                ctx.stroke();
              }
            } else if (annotation.type === 'text') {
              ctx.fillStyle = annotation.color;
              ctx.font = `${annotation.fontSize * 2}px Arial`; // Scale up for better visibility
              ctx.fillText(
                annotation.text, 
                annotation.x * (canvas.width / 800), 
                annotation.y * (canvas.height / 600)
              );
            }
          });
        }

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.src = photo.url;
    });
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const filteredIssues = getFilteredIssues();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Header
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(settings.companyName || 'Audit Report', margin, yPosition);
      yPosition += 12;

      // Project details
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Project: ${project.name}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Location: ${project.location}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Audit Date: ${new Date(project.auditDate).toLocaleDateString()}`, margin, yPosition);
      yPosition += 5;
      
      if (project.client) {
        pdf.text(`${settings.preparedForLabel || 'Prepared For'}: ${project.client}`, margin, yPosition);
        yPosition += 5;
      }
      
      if (selectedAssignee !== 'all') {
        pdf.text(`${settings.assignedToLabel || 'Assigned To'}: ${selectedAssignee}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 8;

      // Issues summary
      checkPageBreak(15);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${settings.issuesLabel || 'Issues'} Summary`, margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total ${settings.issuesLabel || 'Issues'}: ${filteredIssues.length}`, margin, yPosition);
      yPosition += 5;
      
      const completedCount = filteredIssues.filter(i => i.completed).length;
      pdf.text(`Completed: ${completedCount}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Pending: ${filteredIssues.length - completedCount}`, margin, yPosition);
      yPosition += 10;

      // Table header
      checkPageBreak(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Photo', margin, yPosition);
      pdf.text('Issue Details', margin + 70, yPosition);
      yPosition += 5;
      
      // Draw header line
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Issues in table format
      for (let i = 0; i < filteredIssues.length; i++) {
        const issue = filteredIssues[i];
        
        if (issue.photos.length === 0) {
          // Issue without photos
          checkPageBreak(25);
          
          // Issue details column
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          const issueTitle = `${settings.issueLabel || 'Issue'} #${issue.order}: ${issue.title}`;
          pdf.text(issueTitle, margin + 70, yPosition);
          yPosition += 5;

          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          
          const details = [
            `Type: ${issue.type} | Priority: ${issue.priority} | Status: ${issue.completed ? 'Completed' : 'Pending'}`,
            issue.location ? `Location: ${issue.location}` : null,
            issue.assignedTo ? `Assigned To: ${issue.assignedTo}` : null,
            issue.description ? `Description: ${issue.description}` : null
          ].filter(Boolean);

          details.forEach(detail => {
            const lines = pdf.splitTextToSize(detail!, pageWidth - margin - 75);
            lines.forEach((line: string) => {
              checkPageBreak(4);
              pdf.text(line, margin + 70, yPosition);
              yPosition += 4;
            });
          });

          yPosition += 5;
          
        } else {
          // Issue with photos - table format
          for (const photo of issue.photos) {
            checkPageBreak(60);
            
            const rowStartY = yPosition;
            
            try {
              // Create annotated image
              const annotatedImageUrl = await createAnnotatedImage(photo);
              
              // Add photo to left column (60mm width)
              const img = new Image();
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = annotatedImageUrl;
              });

              const maxPhotoWidth = 60;
              const maxPhotoHeight = 45;
              
              let photoWidth = maxPhotoWidth;
              let photoHeight = (img.height / img.width) * photoWidth;
              
              if (photoHeight > maxPhotoHeight) {
                photoHeight = maxPhotoHeight;
                photoWidth = (img.width / img.height) * photoHeight;
              }

              pdf.addImage(img, 'JPEG', margin, yPosition, photoWidth, photoHeight);
              
              // Issue details in right column
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              const issueTitle = `${settings.issueLabel || 'Issue'} #${issue.order}: ${issue.title}`;
              pdf.text(issueTitle, margin + 70, yPosition + 5);
              
              let detailY = yPosition + 12;
              
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              
              const details = [
                `Photo #${photo.order}: ${photo.fileName}`,
                `Type: ${issue.type} | Priority: ${issue.priority}`,
                `Status: ${issue.completed ? 'Completed' : 'Pending'}`,
                issue.location ? `Location: ${issue.location}` : null,
                issue.assignedTo ? `Assigned To: ${issue.assignedTo}` : null,
                issue.signedOff ? `Signed Off: ${new Date(issue.signOffDate!).toLocaleDateString()}` : null
              ].filter(Boolean);

              details.forEach(detail => {
                const lines = pdf.splitTextToSize(detail!, pageWidth - margin - 75);
                lines.forEach((line: string) => {
                  pdf.text(line, margin + 70, detailY);
                  detailY += 4;
                });
              });

              // Add sign-off information if available
              if (issue.signedOff) {
                detailY += 2;
                pdf.setFont('helvetica', 'bold');
                pdf.text('Sign-off Details:', margin + 70, detailY);
                detailY += 4;
                pdf.setFont('helvetica', 'normal');
                
                const signOffDetails = [
                  `Signed off: ${new Date(issue.signOffDate!).toLocaleDateString()}`,
                  issue.signOffNotes ? `Notes: ${issue.signOffNotes}` : null,
                  issue.signOffPhoto ? `Evidence photo: ${issue.signOffPhoto.fileName}` : null
                ].filter(Boolean);

                signOffDetails.forEach(detail => {
                  const lines = pdf.splitTextToSize(detail!, pageWidth - margin - 75);
                  lines.forEach((line: string) => {
                    pdf.text(line, margin + 70, detailY);
                    detailY += 4;
                  });
                });
              }

              if (issue.description) {
                detailY += 2;
                pdf.setFont('helvetica', 'bold');
                pdf.text('Description:', margin + 70, detailY);
                detailY += 4;
                pdf.setFont('helvetica', 'normal');
                
                const descLines = pdf.splitTextToSize(issue.description, pageWidth - margin - 75);
                descLines.forEach((line: string) => {
                  pdf.text(line, margin + 70, detailY);
                  detailY += 4;
                });
              }

              // Move to next row (ensure minimum spacing)
              yPosition = Math.max(yPosition + photoHeight + 5, detailY + 5);
              
            } catch (error) {
              console.error('Error adding image to PDF:', error);
              
              // Fallback: text only
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${settings.issueLabel || 'Issue'} #${issue.order}: ${issue.title}`, margin + 70, yPosition);
              yPosition += 5;
              
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              pdf.text(`Photo #${photo.order}: ${photo.fileName} (Could not load image)`, margin + 70, yPosition);
              yPosition += 10;
            }
          }
          
          // Add sign-off photo if available and no other photos
          if (issue.signOffPhoto && issue.photos.length === 0) {
            checkPageBreak(60);
            
            try {
              const img = new Image();
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = issue.signOffPhoto!.url;
              });

              const maxPhotoWidth = 60;
              const maxPhotoHeight = 45;
              
              let photoWidth = maxPhotoWidth;
              let photoHeight = (img.height / img.width) * photoWidth;
              
              if (photoHeight > maxPhotoHeight) {
                photoHeight = maxPhotoHeight;
                photoWidth = (img.width / img.height) * photoHeight;
              }

              pdf.addImage(img, 'JPEG', margin, yPosition, photoWidth, photoHeight);
              
              // Issue details in right column
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              const issueTitle = `${settings.issueLabel || 'Issue'} #${issue.order}: ${issue.title}`;
              pdf.text(issueTitle, margin + 70, yPosition + 5);
              
              let detailY = yPosition + 12;
              
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              
              const details = [
                `Close-out Photo: ${issue.signOffPhoto.fileName}`,
                `Type: ${issue.type} | Priority: ${issue.priority}`,
                `Status: ${issue.completed ? 'Completed' : 'Pending'}`,
                issue.location ? `Location: ${issue.location}` : null,
                issue.assignedTo ? `Assigned To: ${issue.assignedTo}` : null,
                issue.signedOff ? `Signed Off: ${new Date(issue.signOffDate!).toLocaleDateString()}` : null,
                issue.signOffNotes ? `Sign-off Notes: ${issue.signOffNotes}` : null
              ].filter(Boolean);

              details.forEach(detail => {
                const lines = pdf.splitTextToSize(detail!, pageWidth - margin - 75);
                lines.forEach((line: string) => {
                  pdf.text(line, margin + 70, detailY);
                  detailY += 4;
                });
              });

              yPosition = Math.max(yPosition + photoHeight + 5, detailY + 5);
              
            } catch (error) {
              console.error('Error adding sign-off image to PDF:', error);
            }
          }
        }
        
        // Add separator line between issues
        if (i < filteredIssues.length - 1) {
          checkPageBreak(5);
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += 5;
        }
      }

      // Add footer to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const pageNumber = i;
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        // Page number on the right
        const pageText = `Page ${pageNumber} of ${totalPages}`;
        const pageTextWidth = pdf.getTextWidth(pageText);
        pdf.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 5);
        
        // Footer text on the left (if exists)
        if (settings.reportFooter) {
          pdf.setFont('helvetica', 'italic');
          pdf.text(settings.reportFooter, margin, pageHeight - 5);
        }
      }

      // Save the PDF
      const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_')}_audit_report${selectedAssignee !== 'all' ? `_${selectedAssignee.replace(/[^a-z0-9]/gi, '_')}` : ''}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredIssues = getFilteredIssues();
  const uniqueAssignees = getUniqueAssignees();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Report Filters */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={16} className="text-gray-400" />
              <h3 className="font-medium text-gray-900">Report Filters</h3>
            </div>

            <div className="space-y-4">
              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Assignee
                </label>
                <select
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Assignees</option>
                  <option value="">Unassigned</option>
                  {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Include Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeCompleted}
                      onChange={(e) => setIncludeCompleted(e.target.checked)}
                      className="mr-2"
                    />
                    Completed Issues
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includePending}
                      onChange={(e) => setIncludePending(e.target.checked)}
                      className="mr-2"
                    />
                    Pending Issues
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Report Preview */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Report Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Project:</strong> {project.name}</p>
                <p><strong>Location:</strong> {project.location}</p>
                <p><strong>Date:</strong> {new Date(project.auditDate).toLocaleDateString()}</p>
                {selectedAssignee !== 'all' && (
                  <p><strong>Assignee:</strong> {selectedAssignee || 'Unassigned'}</p>
                )}
                <p><strong>Total Issues:</strong> {filteredIssues.length}</p>
                <p><strong>Completed:</strong> {filteredIssues.filter(i => i.completed).length}</p>
                <p><strong>Pending:</strong> {filteredIssues.filter(i => !i.completed).length}</p>
                <p><strong>Total Photos:</strong> {filteredIssues.reduce((acc, issue) => acc + issue.photos.length, 0)}</p>
                <p><strong>Format:</strong> Table layout (Photo | Issue Details)</p>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generatePDF}
              disabled={isGenerating || filteredIssues.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Generate PDF Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};