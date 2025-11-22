'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { cn } from '@/lib/utils';
import { Scan, X } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Scanner({ onScan, label, value, onChange, className }: ScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        `reader-${label.replace(/\s+/g, '-')}`,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [
            // QR Codes
            Html5QrcodeSupportedFormats.QR_CODE,

            // Common 1D Barcodes
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF,

            // Additional formats
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.AZTEC
          ]
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onScan(decodedText);
          setIsScanning(false);
          scanner.clear();
          scannerRef.current = null;
        },
        (error) => {
          // console.warn(error);
        }
      );

      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isScanning, onScan, label]);

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Enter ${label}...`}
        />
        <button
          onClick={() => isScanning ? stopScanning() : setIsScanning(true)}
          className={cn(
            "p-2 rounded-md transition-colors",
            isScanning
              ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          )}
          title={isScanning ? "Stop Scanning" : "Scan QR Code or Barcode"}
        >
          {isScanning ? <X size={20} /> : <Scan size={20} />}
        </button>
      </div>

      {isScanning && (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-700 bg-black">
          <div id={`reader-${label.replace(/\s+/g, '-')}`} />
        </div>
      )}
    </div>
  );
}
