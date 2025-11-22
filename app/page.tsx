'use client';

import { useState, useEffect } from 'react';
import { Scanner } from '@/components/Scanner';
import { Recorder } from '@/components/Recorder';
import Image from 'next/image';
import { Package, Box, History, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentScan {
  orderId: string;
  skuId: string;
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
                  SKU: {scan.skuId}
                </p>
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
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recentScans');
    if (saved) {
      try {
        setRecentScans(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent scans', e);
      }
    }
  }, []);

  const addRecentScan = () => {
    const newScan: RecentScan = {
      orderId,
      skuId,
      timestamp: Date.now(),
    };

    const updated = [newScan, ...recentScans].slice(0, 5); // Keep last 5
    setRecentScans(updated);
    localStorage.setItem('recentScans', JSON.stringify(updated));

    // Clear inputs after successful save (optional, but good UX)
    setOrderId('');
    setSkuId('');
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
                  label="Order ID"
                  value={orderId}
                  onChange={setOrderId}
                  onScan={setOrderId}
                />

                <Scanner
                  label="SKU ID"
                  value={skuId}
                  onChange={setSkuId}
                  onScan={setSkuId}
                />
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
