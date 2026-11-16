'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import { QrCode, Download, Copy, ExternalLink, Check, Store, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import { subscriptionService } from '@/services/subscriptionService';

export default function ShopQrModal({ isOpen, onClose, shopSlug, businessName }) {
  const { toastSuccess, toastError } = useToast();
  const [qrBlobUrl, setQrBlobUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [entitlement, setEntitlement] = useState(null);
  const [checkingEntitlement, setCheckingEntitlement] = useState(false);

  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shop/${shopSlug || 'sai-textiles'}`
    : `http://localhost:3000/shop/${shopSlug || 'sai-textiles'}`;

  // Fetch company's authoritative self-shopping entitlement
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchStatus = async () => {
      setCheckingEntitlement(true);
      try {
        const res = await subscriptionService.getCompanyStatus();
        const payload = res?.data?.data || res?.data || res;
        if (isMounted && payload?.selfShopping) {
          setEntitlement(payload.selfShopping);
        }
      } catch (err) {
        console.warn('Could not verify entitlement status in QR modal:', err);
      } finally {
        if (isMounted) setCheckingEntitlement(false);
      }
    };

    fetchStatus();
    return () => { isMounted = false; };
  }, [isOpen]);

  // QR is open when user subscribes to the ₹59,999 lifetime plan (LIFETIME_ACTIVE), otherwise locked
  const isUnlocked = entitlement ? (entitlement.isLifetime === true || entitlement.status === 'LIFETIME_ACTIVE') : true;
  const isLocked = !checkingEntitlement && entitlement && !isUnlocked;

  useEffect(() => {
    if (!isOpen || !portalUrl || isLocked) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateQr = async () => {
      try {
        const url = await QRCode.toDataURL(portalUrl, {
          width: 320,
          margin: 2,
          color: {
            dark: '#1e1b4b',
            light: '#ffffff'
          }
        });

        if (isMounted && url) {
          setQrBlobUrl(url);
        }
      } catch (err) {
        console.error('QR code generation failed:', err);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    };

    generateQr();

    return () => {
      isMounted = false;
    };
  }, [isOpen, portalUrl, isUnlocked]);

  const handleDownload = () => {
    if (isLocked) {
      toastError('Custom Online Shop Store is locked. Please unlock the ₹59,999 Lifetime Plan.');
      return;
    }
    if (!qrBlobUrl) return;
    const a = document.createElement('a');
    a.href = qrBlobUrl;
    a.download = `${shopSlug || 'shop'}-catalogue-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toastSuccess('Shop Catalogue QR Code downloaded successfully!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toastSuccess('Shop portal URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Customer Shop Catalogue QR Code" size="md">
      <div className="space-y-5 text-center">
        <div>
          <div className="inline-flex items-center space-x-2 text-indigo-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Public Customer Portal</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {businessName || 'Sai textiles'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Customers can scan this QR code with their mobile cameras to view your live product catalogue at <span className="font-mono text-indigo-600 font-bold">/shop/{shopSlug}</span>.
          </p>
        </div>

        {/* Locked State if not on ₹59,999 Lifetime Plan */}
        {isLocked ? (
          <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-200/80 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 mb-1.5">
                FEATURE LOCKED
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Unlock with ₹59,999 Lifetime Plan
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Customer Shop QR code generation, download, and public self-shopping ordering are locked. Subscribe to the ₹59,999 one-time lifetime plan to permanently activate this feature.
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider">Lifetime Plan</span>
                <p className="text-xs font-bold text-slate-900">₹59,999 <span className="text-[10px] text-slate-500 font-normal">One-Time Payment</span></p>
              </div>
              <Link
                href="/settings/subscription"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <span>Unlock Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* QR Code Container */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/90 flex flex-col items-center justify-center min-h-[260px] shadow-inner">
              {isGenerating || checkingEntitlement ? (
                <div className="flex flex-col items-center space-y-2 text-slate-400">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-semibold">Generating QR Code...</span>
                </div>
              ) : qrBlobUrl ? (
                <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                  <img
                    src={qrBlobUrl}
                    alt="Shop Catalogue QR Code"
                    className="w-56 h-56 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="text-xs text-rose-500 font-semibold">
                  Failed to generate QR code.
                </div>
              )}
            </div>

            {/* Shareable Link Box */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2 text-left">
              <span className="text-xs font-mono text-slate-700 truncate select-all">
                {portalUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shrink-0 transition cursor-pointer text-xs font-bold flex items-center space-x-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                type="button"
                onClick={handleDownload}
                disabled={!qrBlobUrl || isGenerating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 shadow-sm"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download QR Code (PNG)
              </Button>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                Open Customer Portal
              </a>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
