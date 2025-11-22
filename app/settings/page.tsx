'use client';

import { useState, useEffect } from 'react';
import { Save, Folder, Loader2, CheckCircle2, Globe, HardDrive } from 'lucide-react';

interface StorageConfig {
  storageType: 'local' | 'url';
  localPath?: string;
  saveUrl?: string;
  readUrl?: string;
  apiKey?: string;
}

export default function SettingsPage() {
  const [storageType, setStorageType] = useState<'local' | 'url'>('local');
  const [localPath, setLocalPath] = useState('');
  const [saveUrl, setSaveUrl] = useState('');
  const [readUrl, setReadUrl] = useState('');
  const [apiKey, setApiKey] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then((data: StorageConfig) => {
        setStorageType(data.storageType || 'local');
        setLocalPath(data.localPath || '');
        setSaveUrl(data.saveUrl || '');
        setReadUrl(data.readUrl || '');
        setApiKey(data.apiKey || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const config: StorageConfig = {
        storageType,
        localPath: storageType === 'local' ? localPath : '',
        saveUrl: storageType === 'url' ? saveUrl : '',
        readUrl: storageType === 'url' ? readUrl : '',
        apiKey: storageType === 'url' ? apiKey : '',
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleBrowse = async () => {
    try {
      const res = await fetch('/api/system/pick-folder', { method: 'POST' });
      const data = await res.json();

      if (data.path) {
        setLocalPath(data.path);
      }
    } catch (err) {
      console.error('Failed to pick folder', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <main className="p-8 text-gray-900 dark:text-white max-w-4xl mx-auto transition-colors duration-300">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
            <Folder size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-1">Storage Configuration</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Choose where video recordings should be saved: locally on your machine or to a remote URL endpoint.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Storage Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Storage Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setStorageType('local')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border ${
                  storageType === 'local'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <HardDrive size={20} />
                Local Storage
              </button>
              <button
                onClick={() => setStorageType('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all border ${
                  storageType === 'url'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Globe size={20} />
                URL Storage
              </button>
            </div>
          </div>

          {/* Local Storage Settings */}
          {storageType === 'local' && (
            <div className="space-y-4 p-4 bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Local Storage Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localPath}
                    onChange={(e) => setLocalPath(e.target.value)}
                    className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="/path/to/recordings"
                  />
                  <button
                    onClick={handleBrowse}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Browse
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Recordings will be saved to: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{'{path}'}/YYYY-MM-DD/orderId/skuId/</code>
                </p>
              </div>
            </div>
          )}

          {/* URL Storage Settings */}
          {storageType === 'url' && (
            <div className="space-y-4 p-4 bg-white dark:bg-black/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Save URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={saveUrl}
                  onChange={(e) => setSaveUrl(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="https://api.example.com/videos/upload"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  POST endpoint to save video recordings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Read URL <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={readUrl}
                  onChange={(e) => setReadUrl(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="https://api.example.com/videos/list"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  GET endpoint to retrieve/list recordings
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Bearer token or API key"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Will be sent as: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Authorization: Bearer {'{apiKey}'}</code>
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' && <CheckCircle2 size={16} />}
              {message.text}
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || (storageType === 'local' && !localPath) || (storageType === 'url' && !saveUrl)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
