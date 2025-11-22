'use client';

import { useState } from 'react';
import { Scanner } from '@/components/Scanner';
import { Recorder } from '@/components/Recorder';
import Image from 'next/image';
import { Package, Box, History } from 'lucide-react';

export default function Home() {
  const [orderId, setOrderId] = useState('');
  const [skuId, setSkuId] = useState('');

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-red-900/20">
              <Image src="/logo.png" alt="Trakhija Logo" fill className="object-cover" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Trakhija</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              System Ready
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Box size={20} className="text-blue-400" />
                Order Details
              </h2>

              <div className="space-y-6">
                <Scanner
                  label="Order ID"
                  value={orderId}
                  onChange={setOrderId}
                  onScan={setOrderId}
                />

                <div className="h-px bg-gray-800" />

                <Scanner
                  label="SKU ID"
                  value={skuId}
                  onChange={setSkuId}
                  onScan={setSkuId}
                />
              </div>

              <div className="mt-6 p-4 bg-blue-900/10 border border-blue-900/20 rounded-xl text-sm text-blue-300">
                <p className="font-medium mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1 opacity-80">
                  <li>Scan the Order ID barcode first.</li>
                  <li>Scan the product SKU.</li>
                  <li>Start recording the unboxing process.</li>
                </ul>
              </div>
            </div>

            {/* Recent Activity Placeholder - Could be expanded later */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm opacity-50">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <History size={20} className="text-gray-400" />
                Recent Scans
              </h2>
              <div className="text-sm text-gray-500 text-center py-8">
                No recent activity
              </div>
            </div>
          </div>

          {/* Main Content - Recorder */}
          <div className="lg:col-span-8">
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-1 backdrop-blur-sm">
              <Recorder
                orderId={orderId}
                skuId={skuId}
                className="w-full"
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
