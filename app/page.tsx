'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@/components/Scanner';
import { Recorder } from '@/components/Recorder';
import Image from 'next/image';
import { Package, Box, History, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentScan {
  orderId: string;
  skuId?: string;
  notes?: string;
  timestamp: number;
}

function RecentScansList({ scans }: { scans: RecentScan[] }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 backdrop-blur-sm opacity-50">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <History size={20} className="text-gray-500 dark:text-gray-400" />
        Recent Scans
      </h2>
      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {scans.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">
            No recent activity
          </div>
        ) : (
          scans.map((scan, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-800/50">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Package size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate text-gray-900 dark:text-gray-200">
                  {scan.orderId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {scan.skuId ? `SKU: ${scan.skuId}` : 'No SKU'}
                </p>
                {scan.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 italic">
                    {scan.notes}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                  <Clock size={10} />
                  <span>{new Date(scan.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [orderId, setOrderId] = useState('');
  const [skuId, setSkuId] = useState('');
  const [notes, setNotes] = useState('');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  // Fetch recent scans from API instead of localStorage
  const fetchRecentScans = async () => {
    try {
      const res = await fetch('/api/recent-scans?limit=5');
      const data = await res.json();
      if (data.success && data.recordings) {
        // Convert metadata format to RecentScan format
        const scans = data.recordings.map((rec: any) => ({
          orderId: rec.orderId,
          skuId: rec.skuId,
          notes: rec.notes,
          timestamp: rec.timestamp
        }));
        setRecentScans(scans);
      }
    } catch (error) {
      console.error('Failed to fetch recent scans:', error);
    }
  };

  useEffect(() => {
    fetchRecentScans();
  }, []);

  const addRecentScan = () => {
    // Refresh recent scans from API after successful save
    fetchRecentScans();

    // Clear inputs after successful save
    setOrderId('');
    setSkuId('');
    setNotes('');
  };

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white selection:bg-blue-500/30 transition-colors duration-300">
      {/* System Status - Top Right Absolute */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-50">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/5 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 backdrop-blur-sm shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 hidden sm:inline">System Ready</span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:hidden">Ready</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Box size={20} className="text-blue-600 dark:text-blue-400" />
                Order Details
              </h2>

              <div className="space-y-6">
                <Scanner
                  label="Order or PO ID"
                  value={orderId}
                  onChange={setOrderId}
                  onScan={setOrderId}
                />

                <Scanner
                  label="SKU ID (Optional)"
                  value={skuId}
                  onChange={setSkuId}
                  onScan={setSkuId}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none"
                    placeholder="Add any notes about this return..."
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                  <li>Scan the Order ID barcode first.</li>
                  <li>Scan the product SKU.</li>
                  <li>Start recording the unboxing process.</li>
                </ul>
              </div>
            </div>

            {/* Recent Activity - Desktop Only (Left Sidebar) */}
            <div className="hidden lg:block">
              <RecentScansList scans={recentScans} />
            </div>
          </div>

          {/* Main Content - Recorder & Recent Scans */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-1 backdrop-blur-sm">
              <Recorder
                orderId={orderId}
                skuId={skuId}
                notes={notes}
                className="w-full"
                onSaveSuccess={addRecentScan}
              />
            </div>

            {/* Recent Activity - Mobile Only (Below Video) */}
            <div className="lg:hidden">
              <RecentScansList scans={recentScans} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
