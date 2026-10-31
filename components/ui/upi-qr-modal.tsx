'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpiQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
  residentName?: string;
}

export function UpiQrModal({ isOpen, onClose, amount, residentName }: UpiQrModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/UPI.jpeg';
    link.download = 'pg-manager-upi-qr.jpeg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'PG Manager UPI Payment',
          text: amount ? `Pay ₹${amount.toLocaleString('en-IN')}` : 'Pay via UPI',
          url: window.location.origin + '/UPI.jpeg',
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            'pointer-events-auto',
            'bg-white rounded-3xl shadow-2xl',
            'w-full max-w-md',
            'animate-in zoom-in-95 duration-200'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E5E5EA]">
            <div>
              <h2 className="text-[20px] font-semibold text-[#1C1C1E] tracking-[-0.022em]">
                Scan to Pay via UPI
              </h2>
              {amount && (
                <p className="text-[28px] font-bold text-[#007AFF] tracking-[-0.024em] mt-1">
                  ₹{amount.toLocaleString('en-IN')}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center transition-all duration-200"
            >
              <X className="w-5 h-5 text-[#1C1C1E]" strokeWidth={2} />
            </button>
          </div>

          {/* QR Code */}
          <div className="p-8 flex flex-col items-center">
            <div className="relative">
              {/* QR Code with Apple-style shadow */}
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#E5E5EA]">
                <Image
                  src="/UPI.jpeg"
                  alt="UPI QR Code"
                  width={280}
                  height={280}
                  className="rounded-2xl"
                  priority
                />
              </div>

              {/* Logo overlay in corner */}
              <div className="absolute -top-3 -right-3 bg-white rounded-full p-2 shadow-lg border-2 border-[#E5E5EA]">
                <Image
                  src="/logo.png"
                  alt="PG Manager"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
            </div>

            {residentName && (
              <div className="mt-6 px-4 py-2 bg-[#F2F2F7] rounded-full">
                <p className="text-[13px] text-[#8E8E93] font-medium">
                  Payment for: <span className="text-[#1C1C1E]">{residentName}</span>
                </p>
              </div>
            )}

            <p className="text-[13px] text-[#8E8E93] text-center mt-4 max-w-xs">
              Open any UPI app (Google Pay, PhonePe, Paytm, etc.) and scan this QR code to complete the payment
            </p>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[#E5E5EA] flex gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 h-11 rounded-xl bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#1C1C1E] font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Download className="w-5 h-5" strokeWidth={2} />
              Download
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleShare}
                className="flex-1 h-11 rounded-xl bg-[#007AFF] hover:bg-[#0071EB] text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-all duration-200 shadow-sm"
              >
                <Share2 className="w-5 h-5" strokeWidth={2} />
                Share
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
