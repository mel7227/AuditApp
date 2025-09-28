import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Upload, Save } from 'lucide-react';
import { Settings } from '../types';
import { storage } from '../utils/storage';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    preparedForLabel: '',
    assignedToLabel: '',
    issueLabel: '',
    issuesLabel: '',
    reportFooter: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(storage.getSettings());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    storage.saveSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings(prev => ({
          ...prev,
          companyLogo: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Building2 size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Customize your site audit reports and company details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Company Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 size={20} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Company Details</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  placeholder="Enter your company name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div className="flex items-center gap-4">
                  {settings.companyLogo && (
                    <img
                      src={settings.companyLogo}
                      alt="Company Logo"
                      className="w-16 h-16 object-contain border border-gray-200 rounded-lg"
                    />
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Upload size={16} />
                      Upload Logo
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Report Labels & Terminology */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Report Labels & Terminology
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  "Prepared For" Label
                </label>
                <input
                  type="text"
                  value={settings.preparedForLabel}
                  onChange={(e) => setSettings({ ...settings, preparedForLabel: e.target.value })}
                  placeholder="Prepared For"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  "Assigned To" Label
                </label>
                <input
                  type="text"
                  value={settings.assignedToLabel}
                  onChange={(e) => setSettings({ ...settings, assignedToLabel: e.target.value })}
                  placeholder="Assigned To"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue (Singular)
                </label>
                <input
                  type="text"
                  value={settings.issueLabel}
                  onChange={(e) => setSettings({ ...settings, issueLabel: e.target.value })}
                  placeholder="Issue"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issues (Plural)
                </label>
                <input
                  type="text"
                  value={settings.issuesLabel}
                  onChange={(e) => setSettings({ ...settings, issuesLabel: e.target.value })}
                  placeholder="Issues"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Footer
              </label>
              <textarea
                value={settings.reportFooter}
                onChange={(e) => setSettings({ ...settings, reportFooter: e.target.value })}
                placeholder="Add any footer text for your reports"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};