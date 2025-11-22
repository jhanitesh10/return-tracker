'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Play, Folder, FileVideo, ChevronRight, Home, Loader2, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  name: string;
  type: 'folder' | 'file';
  path: string; // Relative path for navigation
  fullPath: string; // Absolute path for playing

  // Search result fields
  date?: string;
  orderId?: string;
  skuId?: string;
  relativePath?: string;
}

export default function DashboardPage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPath, setCurrentPath] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<FileItem | null>(null);
  const [mode, setMode] = useState<'list' | 'search'>('list');

  const fetchData = useCallback(async (path: string, searchQuery: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      } else {
        params.append('path', path);
      }

      const res = await fetch(`/api/recordings?${params.toString()}`);
      const data = await res.json();

      setItems(data.items || []);
      setMode(data.mode);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(currentPath, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, currentPath, fetchData]);

  const handleNavigate = (path: string) => {
    setSearch(''); // Clear search when navigating
    setCurrentPath(path);
  };

  const handleBreadcrumbClick = (index: number) => {
    const parts = currentPath.split('/').filter(Boolean);
    const newPath = parts.slice(0, index + 1).join('/');
    handleNavigate(newPath);
  };

  return (
    <main className="p-8 text-gray-900 dark:text-white h-screen flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Recordings Explorer</h1>

        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order ID, SKU, or Date..."
            className="w-full bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Breadcrumbs (Only in List Mode) */}
      {mode === 'list' && (
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => handleNavigate('')}
            className="hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <Home size={16} />
            <span>Root</span>
          </button>

          {currentPath.split('/').filter(Boolean).map((part, index) => (
            <div key={index} className="flex items-center gap-2">
              <ChevronRight size={14} />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
              >
                {part}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Folder size={48} className="mb-4 opacity-50" />
            <p>No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => item.type === 'folder' ? handleNavigate(item.path) : setSelectedVideo(item)}
                className={cn(
                  "group p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 relative overflow-hidden",
                  item.type === 'folder'
                    ? "bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                    : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-lg",
                    item.type === 'folder' ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  )}>
                    {item.type === 'folder' ? <Folder size={24} /> : <FileVideo size={24} />}
                  </div>
                  {item.type === 'file' && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-1.5 rounded-full shadow-lg">
                      <Play size={12} fill="currentColor" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-medium truncate text-sm" title={item.name}>
                    {item.name}
                  </h3>
                  {mode === 'search' && item.relativePath && (
                    <p className="text-xs text-gray-500 truncate mt-1" title={item.relativePath}>
                      {item.relativePath}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-8">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative flex flex-col max-h-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-black/50">
              <h3 className="font-bold text-lg truncate pr-4 text-gray-900 dark:text-white">{selectedVideo.name}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[400px]">
              <video
                src={`/api/video?path=${encodeURIComponent(selectedVideo.fullPath)}`}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
