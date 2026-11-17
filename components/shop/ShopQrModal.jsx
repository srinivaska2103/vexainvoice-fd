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
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [entitlement, setEntitlement] = useState(null);
  const [checkingEntitlement, setCheckingEntitlement] = useState(false);

  // Production customer portal live path
  const productionBase = process.env.NEXT_PUBLIC_APP_URL || 'https://app.vexainvoice.vexatech.in';
  const cleanShopSlug = (shopSlug || 'vexa-000103').toLowerCase();

  // Live Production URL (used by QR Code matrix and primary share)
  const portalUrl = `${productionBase}/shop/${cleanShopSlug}`;

  // Localhost development URL for local testing
  const localUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shop/${cleanShopSlug}`
    : `http://localhost:3000/shop/${cleanShopSlug}`;

  // Fetch company's authoritative self-shopping entitlement
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchStatus = async () => {
      setCheckingEntitlement(true);
      try {
        const res = await subscriptionService.getCompanyStatus();
        const payload = res?.data?.data || res?.data || res;
        if (isMounted) {
          // Check access policy or company tier directly
          const isGrowthOrLifetime = payload?.access_policy?.growth_active ||
            payload?.access_policy?.access_tier === 'GROWTH' ||
            payload?.access_policy?.access_tier === 'LIFETIME' ||
            payload?.access_policy?.qr_self_shopping_unlocked ||
            payload?.company?.self_shopping_status === 'GROWTH_ACTIVE' ||
            payload?.company?.self_shopping_status === 'LIFETIME_ACTIVE' ||
            payload?.selfShopping?.status === 'GROWTH_ACTIVE' ||
            payload?.selfShopping?.status === 'LIFETIME_ACTIVE';

          setEntitlement({
            unlocked: isGrowthOrLifetime,
            tier: payload?.access_policy?.access_tier || 'STARTER',
            ...payload?.selfShopping
          });
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

  // QR is open when user subscribes to the ₹999 Growth plan (or Lifetime plan), locked on Starter plan
  const isUnlocked = entitlement ? (entitlement.unlocked === true) : false;
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
      toastError('Customer Online Shop & Catalogue QR is locked for Starter Plan. Please upgrade to the Growth Plan.');
      return;
    }
    if (!qrBlobUrl) return;
    const a = document.createElement('a');
    a.href = qrBlobUrl;
    a.download = `${cleanShopSlug || 'shop'}-catalogue-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toastSuccess('Shop Catalogue QR Code downloaded successfully!');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    toastSuccess('Live production store URL copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLocalLink = () => {
    navigator.clipboard.writeText(localUrl);
    setCopiedLocal(true);
    toastSuccess('Localhost store URL copied to clipboard!');
    setTimeout(() => setCopiedLocal(false), 2000);
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
            Customers can scan this QR code with their mobile cameras to view your live product catalogue at <span className="font-mono text-indigo-600 font-bold">/shop/{cleanShopSlug}</span>.
          </p>
        </div>

        {/* Locked State if on ₹599 Starter Plan */}
        {isLocked ? (
          <div className="bg-gradient-to-b from-amber-50 to-orange-50/50 p-6 rounded-2xl border border-amber-200/80 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200 mb-1.5">
                GROWTH PLAN REQUIRED
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Unlock with VEXA Growth Plan
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                Customer Shop QR code generation, live digital catalogue, and public self-shopping ordering are exclusively available on the <span className="font-bold text-slate-900">Growth Plan</span>. Upgrade to unlock this feature.
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-left flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black text-amber-700 tracking-wider">Growth Plan</span>
                <p className="text-xs font-bold text-slate-900">₹999 <span className="text-[10px] text-slate-500 font-normal">/ month</span></p>
              </div>
              <Link
                href="/settings/subscription"
                onClick={onClose}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <span>Upgrade to Growth</span>
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

            {/* Live Production URL Box */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center text-indigo-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse inline-block" />
                  Live Production Store URL (QR Target):
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">Public Live</span>
              </div>
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 flex items-center justify-between gap-2 text-left">
                <span className="text-xs font-mono text-indigo-950 font-bold truncate select-all">
                  {portalUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-50 border border-indigo-200 text-indigo-700 shrink-0 transition cursor-pointer text-xs font-bold flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Localhost URL Box for Development */}
            <div className="space-y-1 text-left">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Localhost Testing URL:</span>
                <span className="text-[10px] text-slate-400">Dev Environment</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-left">
                <span className="text-[11px] font-mono text-slate-600 truncate select-all">
                  {localUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLocalLink}
                  className="p-1 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 shrink-0 transition cursor-pointer text-xs flex items-center space-x-1"
                >
                  {copiedLocal ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[10px]">{copiedLocal ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
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
                href={typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? localUrl : portalUrl}
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
