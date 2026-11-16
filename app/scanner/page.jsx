'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ScanBarcode,
  Camera,
  VideoOff,
  RefreshCw,
  Search,
  ShoppingCart,
  Eye,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  History,
  Package,
  Layers,
  ShieldAlert,
  Upload,
  Zap,
  ZapOff,
  ArrowLeft,
  Plus,
  Monitor,
  Smartphone,
  Keyboard,
  Barcode,
  XCircle,
  Tag,
  Building2,
  Info
} from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { productService } from '@/services/productService';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import BarcodeSVG from '@/components/ui/BarcodeSVG';

// Adaptive Binarization helper for low-contrast mobile paper tags
function binarizeImageData(ctx, width, height) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const count = width * height;

  let totalLum = 0;
  const grayArray = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
    grayArray[i] = gray;
    totalLum += gray;
  }

  const avgLum = totalLum / count;
  const threshold = Math.max(70, Math.min(190, avgLum * 0.92));

  for (let i = 0; i < count; i++) {
    const idx = i * 4;
    const v = grayArray[i] < threshold ? 0 : 255;
    data[idx] = v;
    data[idx + 1] = v;
    data[idx + 2] = v;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return imgData;
}

export default function ResponsiveProductScannerPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const { role, checkPermission } = useAuth();
  const canAddProduct = role === 'ADMIN' || role === 'MANAGER' || role === 'STOCK_STAFF';

  // Device & Mode Selection: 'desktop' (USB keyboard scanner) vs 'mobile' (Camera scanner)
  const [activeMode, setActiveMode] = useState('desktop'); // desktop | mobile
  const [isDeviceDetermined, setIsDeviceDetermined] = useState(false);

  // Desktop USB Scanner Input State
  const desktopInputRef = useRef(null);
  const [scannerInputValue, setScannerInputValue] = useState('');
  const [scannerConnected, setScannerConnected] = useState(true);
  const lastScanTimestampRef = useRef(0);
  const lastScannedCodeRef = useRef('');

  // Mobile Camera Elements & State
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScanningActiveRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isPausedAfterScan, setIsPausedAfterScan] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Manual code entry modal / input state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Scanned Product Details & History
  const [scannedResult, setScannedResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [scanSuccessPulse, setScanSuccessPulse] = useState(false);

  // Auto-detect device mode on initial mount (Responsive device selection)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth < 1024;
      if (isTouch && isSmallScreen) {
        setActiveMode('mobile');
      } else {
        setActiveMode('desktop');
      }
      setIsDeviceDetermined(true);
    }
  }, []);

  // Ensure Desktop input stays focused for USB barcode scanners
  const ensureInputFocused = useCallback(() => {
    if (activeMode === 'desktop' && desktopInputRef.current) {
      desktopInputRef.current.focus();
    }
  }, [activeMode]);

  useEffect(() => {
    if (activeMode === 'desktop') {
      ensureInputFocused();
      const timer = setTimeout(ensureInputFocused, 150);
      return () => clearTimeout(timer);
    }
  }, [activeMode, ensureInputFocused, scannedResult]);

  // Global USB Barcode Scanner hardware listener (keyboard-wedge with rapid keystrokes + Enter)
  useEffect(() => {
    let keystrokeBuffer = '';
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e) => {
      // Don't intercept when user is intentionally typing in another input (e.g. manual search)
      if (
        document.activeElement &&
        document.activeElement.tagName === 'INPUT' &&
        document.activeElement !== desktopInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 120) {
        keystrokeBuffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        const rawCode = (keystrokeBuffer || scannerInputValue || '').trim();
        if (rawCode.length >= 2) {
          e.preventDefault();
          const cleanCode = rawCode.replace(/^\*+|\*+$/g, '').replace(/\s+/g, '').trim();
          keystrokeBuffer = '';
          setScannerInputValue('');
          triggerProductLookup(cleanCode, 'USB_BARCODE_SCANNER');
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        keystrokeBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [scannerInputValue]);

  // Clean-up camera on unmount or mode switch
  const stopCameraStream = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  useEffect(() => {
    if (activeMode === 'desktop') {
      stopCameraStream();
    }
  }, [activeMode, stopCameraStream]);

  // Mobile Camera Lifecycle: Start Rear Camera
  const startCamera = async () => {
    stopCameraStream();
    setCameraError('');
    setIsPausedAfterScan(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported on this browser or device.');
        return;
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            facingMode: { ideal: 'environment' }
          }
        });
      } catch (errEnv) {
        if (errEnv.name === 'NotAllowedError' || errEnv.name === 'PermissionDeniedError') {
          throw errEnv;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).catch(() =>
          navigator.mediaDevices.getUserMedia({ video: true })
        );
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      // Check flashlight/torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Load ZXing multi-format barcode reader dynamically
      let readBarcodesWasm = null;
      try {
        const zwasm = await import('zxing-wasm/reader');
        readBarcodesWasm = zwasm.readBarcodes;
      } catch (eWasm) {}

      const {
        MultiFormatReader,
        BarcodeFormat,
        DecodeHintType,
        HTMLCanvasElementLuminanceSource,
        HybridBinarizer,
        BinaryBitmap
      } = await import('@zxing/library');

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new MultiFormatReader();
      reader.setHints(hints);

      const mainCanvas = document.createElement('canvas');
      const cropCanvas = document.createElement('canvas');
      const binCanvas = document.createElement('canvas');

      isScanningActiveRef.current = true;

      const scanLoop = async () => {
        if (!isScanningActiveRef.current || !videoRef.current) return;
        const video = videoRef.current;

        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
          mainCanvas.width = video.videoWidth;
          mainCanvas.height = video.videoHeight;
          const ctx = mainCanvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(video, 0, 0, mainCanvas.width, mainCanvas.height);

          // Focus on centered rectangular viewport
          const cropW = Math.round(mainCanvas.width * 0.75);
          const cropH = Math.round(mainCanvas.height * 0.45);
          const cropX = Math.round((mainCanvas.width - cropW) / 2);
          const cropY = Math.round((mainCanvas.height - cropH) / 2);

          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cCtx = cropCanvas.getContext('2d', { willReadFrequently: true });
          cCtx.drawImage(mainCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

          let detectedRaw = null;
          let detectedFmt = 'CODE_128';

          // Pass 1: WASM Fast Reader
          if (readBarcodesWasm) {
            try {
              const cropImgData = cCtx.getImageData(0, 0, cropW, cropH);
              const wasmResults = await readBarcodesWasm(cropImgData, {
                tryHarder: true,
                tryRotate: true
              });
              if (wasmResults && wasmResults.length > 0 && wasmResults[0].text) {
                detectedRaw = wasmResults[0].text;
                detectedFmt = wasmResults[0].format ? String(wasmResults[0].format).toUpperCase() : 'CODE_128';
              }
            } catch (eWasmRead) {}
          }

          // Pass 2: JS MultiFormat Reader Fallback
          if (!detectedRaw) {
            try {
              const lumSource = new HTMLCanvasElementLuminanceSource(cropCanvas, true);
              const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
              const res = reader.decodeWithState(bitmap);
              if (res && res.getText()) {
                detectedRaw = res.getText();
                detectedFmt = res.getBarcodeFormat() ? String(res.getBarcodeFormat()) : 'CODE_128';
              }
            } catch (eJsRead) {}
          }

          // Pass 3: html5-qrcode fallback
          if (!detectedRaw) {
            try {
              const { Html5QrcodeSupportedFormats, Html5Qrcode } = await import('html5-qrcode');
              const tempTarget = document.getElementById('scanner-temp-canvas');
              if (tempTarget) {
                const qrEngine = new Html5Qrcode('scanner-temp-canvas', {
                  formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E
                  ],
                  verbose: false
                });
                const qrRes = await qrEngine.scanFileV2(cropCanvas.toDataURL('image/png'), false);
                if (qrRes && qrRes.decodedText) {
                  detectedRaw = qrRes.decodedText;
                  detectedFmt = qrRes.result?.format?.formatName || 'BARCODE';
                }
              }
            } catch (eQr) {}
          }

          if (detectedRaw) {
            const cleanCode = String(detectedRaw).replace(/^\*+|\*+$/g, '').replace(/\s+/g, '').trim();
            if (cleanCode) {
              isScanningActiveRef.current = false;
              stopCameraStream();
              setIsPausedAfterScan(true);
              triggerProductLookup(cleanCode, detectedFmt);
              return;
            }
          }
        }

        if (isScanningActiveRef.current) {
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      };

      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      console.error('Camera access failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera access was denied. Please allow camera permissions in your browser.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera was detected on this device. Use manual barcode entry below.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another application.');
      } else {
        setCameraError('Camera initialization error: ' + (err.message || 'Unknown error'));
      }
      stopCameraStream();
    }
  };

  const toggleFlashlight = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (err) {
        toastError('Unable to toggle flashlight');
      }
    }
  };

  // Photo Tag Upload Handler (Alternative for mobile/tablet)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    stopCameraStream();

    try {
      const {
        BrowserMultiFormatReader,
        BarcodeFormat,
        DecodeHintType
      } = await import('@zxing/library');

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints);
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();

      let detectedCode = null;
      let detectedFmt = 'CODE_128';

      try {
        const res = await codeReader.decodeFromImageElement(img);
        if (res && res.getText()) {
          detectedCode = res.getText();
          detectedFmt = res.getBarcodeFormat() ? String(res.getBarcodeFormat()) : 'CODE_128';
        }
      } catch (e1) {}

      if (detectedCode) {
        const clean = String(detectedCode).replace(/^\*+|\*+$/g, '').replace(/\s+/g, '').trim();
        toastSuccess(`Decoded: ${clean}`);
        triggerProductLookup(clean, detectedFmt);
      } else {
        toastError('Barcode could not be read from image. Ensure the tag is clear and well-lit.');
      }
    } catch (err) {
      toastError('Failed to process image file.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Common Product Lookup Engine (Real backend product/inventory lookup)
  const triggerProductLookup = async (barcodeToResolve, sourceFormat = 'MANUAL') => {
    if (!barcodeToResolve || !barcodeToResolve.trim()) return;
    const cleanCode = String(barcodeToResolve).replace(/^\*+|\*+$/g, '').replace(/\s+/g, '').trim();

    // Prevent accidental duplicate rapid double-scans within 800ms
    const now = Date.now();
    if (cleanCode === lastScannedCodeRef.current && now - lastScanTimestampRef.current < 800) {
      return;
    }
    lastScanTimestampRef.current = now;
    lastScannedCodeRef.current = cleanCode;

    setIsResolving(true);
    setScannedResult(null);

    try {
      const res = await productService.scanCode(cleanCode);
      const item = res.data || res;

      if (item && item.id) {
        const resultItem = {
          ...item,
          scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          scannedCode: cleanCode,
          scannedFormat: sourceFormat
        };

        setScannedResult(resultItem);
        setScanSuccessPulse(true);
        setTimeout(() => setScanSuccessPulse(false), 1200);

        setScanHistory((prev) => [
          {
            id: `scan-${Date.now()}`,
            name: item.name || item.product_name,
            code: cleanCode,
            sku: item.sku,
            format: sourceFormat,
            price: item.unitPrice,
            stock: item.stockQuantity,
            time: resultItem.scannedAt
          },
          ...prev.slice(0, 9)
        ]);

        toastSuccess(`Found: ${item.name || item.product_name}`);
      } else {
        // Unknown barcode scanned
        setScannedResult({
          isUnknown: true,
          scannedCode: cleanCode,
          scannedFormat: sourceFormat,
          scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    } catch (err) {
      console.error('Scan lookup error:', err);
      setScannedResult({
        isUnknown: true,
        scannedCode: cleanCode,
        scannedFormat: sourceFormat,
        scannedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        message: err.message
      });
    } finally {
      setIsResolving(false);
      setScannerInputValue('');
      ensureInputFocused();
    }
  };

  const handleDesktopInputSubmit = (e) => {
    e.preventDefault();
    if (!scannerInputValue.trim()) return;
    triggerProductLookup(scannerInputValue, 'MANUAL_ENTRY');
  };

  const handleManualModalSubmit = (e) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    setShowManualModal(false);
    triggerProductLookup(manualCodeInput.trim(), 'MANUAL_MODAL');
    setManualCodeInput('');
  };

  const handleAddToSale = () => {
    if (!scannedResult || scannedResult.isUnknown) return;
    const targetCode = scannedResult.scannedCode || scannedResult.barcode || scannedResult.sku || '';
    toastSuccess(`Transferring "${scannedResult.name || scannedResult.product_name}" to POS billing...`);
    router.push(`/sales/new?autoScan=${encodeURIComponent(targetCode)}`);
  };

  return (
    <ProtectedRoute permissions={['scanner.view', 'sales.view']}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6 pb-24">
          
          {/* Top Bar with Mode Switcher */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2 text-blue-600 font-extrabold text-xs uppercase tracking-wider mb-1">
                <ScanBarcode className="w-4 h-4 shrink-0" />
                <span>Product Barcode Scanner</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeMode === 'mobile' ? 'Scan Product' : 'Product Barcode Scanner'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                {activeMode === 'mobile'
                  ? 'Point your camera at the product barcode.'
                  : 'Scan a product barcode to find its details instantly.'}
              </p>
            </div>

            {/* Mode Switch Pills */}
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveMode('desktop');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'desktop'
                    ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop (USB)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveMode('mobile');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'mobile'
                    ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Camera</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: DESKTOP SCANNER UI (USB / EXTERNAL SCANNER WORKFLOW)          */}
          {/* ========================================================================= */}
          {activeMode === 'desktop' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Barcode Scanner Input, Scanner Status & Recent Scans */}
              <div className="lg:col-span-6 space-y-6">
                <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <Keyboard className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        Scanner Input Field
                      </span>
                    </div>

                    {/* Scanner Connection Indicator */}
                    <div className="flex items-center space-x-2 text-xs font-bold">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-700">Scanner Ready & Listening</span>
                    </div>
                  </div>

                  {/* Prominent Large Input Field */}
                  <form onSubmit={handleDesktopInputSubmit} className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 block">
                      Ready for barcode scanner trigger or keyboard input:
                    </label>
                    <div className="relative">
                      <Barcode className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={desktopInputRef}
                        type="text"
                        autoFocus
                        value={scannerInputValue}
                        onChange={(e) => setScannerInputValue(e.target.value)}
                        placeholder="Scan or enter barcode / SKU..."
                        className="w-full pl-13 pr-24 py-4 rounded-2xl border-2 border-blue-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 text-lg sm:text-xl font-mono font-bold text-slate-900 placeholder:text-slate-400 transition shadow-inner bg-blue-50/20"
                      />
                      {scannerInputValue && (
                        <button
                          type="button"
                          onClick={() => {
                            setScannerInputValue('');
                            ensureInputFocused();
                          }}
                          className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                          title="Clear input"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isResolving || !scannerInputValue.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40 transition"
                      >
                        {isResolving ? <Spinner size="xs" /> : 'Enter'}
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>• Automatically refocuses after every scan. USB carriage return (Enter) supported.</span>
                      <button
                        type="button"
                        onClick={ensureInputFocused}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        Click to Focus
                      </button>
                    </p>
                  </form>

                  {/* Scanner Guide Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>USB / Bluetooth Scanner Compatibility:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Standard keyboard-wedge scanners (Honeywell, Zebra, TVS, Datalogic) work out of the box. Scan any EAN-13, Code 128, or SKU to instantly inspect stock and push to POS.
                    </p>
                  </div>
                </Card>

                {/* Recent Scanned Products List */}
                <Card className="p-6 bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>Recent Scanned Products ({scanHistory.length})</span>
                    </h3>
                    {scanHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setScanHistory([])}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {scanHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">
                      No products scanned in this session yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar pr-1">
                      {scanHistory.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => triggerProductLookup(item.code, item.format)}
                          className="flex justify-between items-center p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-100 cursor-pointer transition text-xs"
                        >
                          <div className="truncate pr-3">
                            <p className="font-bold text-slate-800 truncate">{item.name}</p>
                            <p className="font-mono text-[10px] text-slate-500">
                              Barcode: #{item.code} {item.sku ? `· SKU: ${item.sku}` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            {item.price !== undefined && (
                              <p className="font-extrabold text-slate-900">{formatCurrency(item.price)}</p>
                            )}
                            <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: Product Details or Empty / Not Found States */}
              <div className="lg:col-span-6 space-y-6">
                <Card
                  className={`p-6 bg-white border shadow-xs transition-all ${
                    scanSuccessPulse
                      ? 'border-emerald-500 ring-4 ring-emerald-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Product Details & Stock Status</span>
                    </h2>
                    {scannedResult && !scannedResult.isUnknown && (
                      <Badge variant="emerald" className="font-extrabold">
                        Match Verified
                      </Badge>
                    )}
                  </div>

                  {isResolving ? (
                    <div className="p-16 text-center space-y-3">
                      <Spinner size="lg" className="text-blue-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                        Looking up product records...
                      </p>
                    </div>
                  ) : !scannedResult ? (
                    <div className="p-16 text-center space-y-3">
                      <ScanBarcode className="w-12 h-12 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold text-slate-700">Scanner Ready for Input</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Scan any barcode with your external scanner or type a barcode number on the left to inspect its live stock.
                      </p>
                    </div>
                  ) : scannedResult.isUnknown ? (
                    // PRODUCT NOT FOUND STATE
                    <div className="p-8 text-center space-y-4">
                      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                        <AlertTriangle className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">No product found for this barcode.</h3>
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          Scanned Code: <span className="font-bold text-slate-800">{scannedResult.scannedCode}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          The scanned barcode does not match any active product or variant in your catalog.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                        {canAddProduct && (
                          <Link
                            href={`/products/new?barcode=${encodeURIComponent(scannedResult.scannedCode)}`}
                            className="w-full sm:w-auto"
                          >
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Add New Product
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setScannedResult(null);
                            ensureInputFocused();
                          }}
                          className="w-full sm:w-auto text-xs font-bold"
                        >
                          Try Another Barcode
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // MATCHED PRODUCT DETAILS
                    <div className="space-y-5">
                      {/* Product Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {scannedResult.matchType === 'MODERN_VARIANT' ? 'Variant Item' : 'Base Product'}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-1">
                            {scannedResult.name || scannedResult.product_name}
                          </h3>
                          {scannedResult.brand && (
                            <p className="text-xs text-slate-500 font-medium">Brand: {scannedResult.brand}</p>
                          )}
                        </div>

                        {/* Visual Scanning Confirmation Badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-emerald-600 flex items-center justify-end space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Scan Verified</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{scannedResult.scannedAt}</span>
                        </div>
                      </div>

                      {/* Barcode SVG Rendering */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                        <BarcodeSVG
                          value={scannedResult.barcode || scannedResult.scannedCode}
                          height={50}
                          unitWidth={1.8}
                          fontSize={11}
                          margin={4}
                        />
                      </div>

                      {/* Product Attributes Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">SKU</span>
                          <span className="font-mono font-bold text-slate-900 truncate block">
                            {scannedResult.sku || 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Barcode</span>
                          <span className="font-mono font-bold text-slate-900 truncate block">
                            {scannedResult.barcode || scannedResult.scannedCode}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Variant Specs</span>
                          <span className="font-semibold text-slate-800 truncate block">
                            {[scannedResult.color, scannedResult.size].filter(Boolean).join(' / ') ||
                              scannedResult.variant_name ||
                              'Standard'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Selling Price</span>
                          <span className="text-base font-black text-slate-900">
                            {formatCurrency(scannedResult.unitPrice || 0)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Available Stock</span>
                          <span
                            className={`text-base font-black ${
                              Number(scannedResult.stockQuantity || 0) > 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {scannedResult.stockQuantity ?? 0} {scannedResult.unit || 'PCS'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">Stock Status</span>
                          {Number(scannedResult.stockQuantity || 0) > 0 ? (
                            <Badge variant="emerald" className="text-[10px]">
                              In Stock
                            </Badge>
                          ) : (
                            <Badge variant="rose" className="text-[10px]">
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Desktop Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <Button
                          type="button"
                          onClick={handleAddToSale}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm py-3 rounded-xl shadow-md shadow-blue-600/20"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Sale (POS)
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/products/${scannedResult.productId || scannedResult.id}`}>
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full text-xs font-bold border-slate-300"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              View Product
                            </Button>
                          </Link>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setScannedResult(null);
                              ensureInputFocused();
                            }}
                            className="w-full text-xs font-bold border-slate-300"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Scan Another
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 2: MOBILE CAMERA SCANNER UI                                      */}
          {/* ========================================================================= */}
          {activeMode === 'mobile' && (
            <div className="space-y-4">
              
              {/* Mobile Viewport Card */}
              <Card className="p-4 sm:p-6 bg-white border border-slate-200 shadow-xs space-y-4">
                
                {/* Mobile Camera Top Bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                      Live Rear Camera
                    </span>
                    {isCameraActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Flashlight / Torch Toggle */}
                  <div className="flex items-center space-x-2">
                    {hasTorch && isCameraActive && (
                      <Button
                        size="xs"
                        variant={isTorchOn ? 'default' : 'outline'}
                        onClick={toggleFlashlight}
                        className={isTorchOn ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold' : ''}
                      >
                        {isTorchOn ? <Zap className="w-3.5 h-3.5 mr-1" /> : <ZapOff className="w-3.5 h-3.5 mr-1" />}
                        Torch
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => setShowManualModal(true)}
                      className="text-xs font-bold"
                    >
                      Enter Code
                    </Button>
                  </div>
                </div>

                {/* Live Camera Viewport Box */}
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[380px] flex items-center justify-center border-2 border-slate-800 shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className={`w-full h-full object-cover max-h-[420px] ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Rectangular Barcode Scanning Reticle Frame */}
                  {isCameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-[82%] max-w-xs h-36 border-2 border-dashed border-blue-400 rounded-2xl bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.3)] flex items-center justify-center relative">
                        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                        
                        {/* Animated Laser Scan Line */}
                        <div className="absolute inset-x-2 h-0.5 bg-blue-400 shadow-[0_0_8px_#3b82f6] animate-pulse" />
                      </div>
                      <span className="text-[11px] font-bold text-white tracking-wider bg-slate-900/80 px-3 py-1 rounded-full mt-3">
                        Point camera at product barcode
                      </span>
                    </div>
                  )}

                  {/* Inactive Camera State */}
                  {!isCameraActive && (
                    <div className="p-8 text-center space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                        <VideoOff className="w-8 h-8" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-300">Camera is currently inactive</p>
                        <p className="text-xs text-slate-500">Tap &quot;Start Camera Scanner&quot; to scan product tags</p>
                      </div>
                      <Button
                        type="button"
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-md"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Camera Scanner
                      </Button>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {cameraError && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-xs text-rose-800 font-semibold">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1.5 flex-1">
                      <p className="leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="xs"
                          variant="secondary"
                          onClick={startCamera}
                          className="bg-white hover:bg-slate-100 text-rose-900 border border-rose-300 font-bold"
                        >
                          Retry Permission
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-white hover:bg-slate-100 text-slate-800 font-bold"
                        >
                          Upload Tag Photo
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mobile Camera Controls Bar */}
                {isCameraActive && (
                  <div className="flex items-center justify-center gap-3 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={stopCameraStream}
                      className="bg-slate-100 text-slate-700 font-bold text-xs"
                    >
                      <VideoOff className="w-3.5 h-3.5 mr-1.5" />
                      Stop Camera
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploadingPhoto}
                      className="text-xs font-bold"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload Photo
                    </Button>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </Card>

              {/* Mobile Scan Result Card */}
              {isResolving ? (
                <Card className="p-8 text-center space-y-3 bg-white border border-slate-200">
                  <Spinner size="md" className="text-blue-600 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Retrieving product details...</p>
                </Card>
              ) : scannedResult ? (
                <Card className="p-5 bg-white border border-slate-200 shadow-sm space-y-4">
                  {scannedResult.isUnknown ? (
                    // Mobile Unknown Product State
                    <div className="text-center space-y-3 py-2">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto border border-rose-200">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">No product found for this barcode.</h4>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">#{scannedResult.scannedCode}</p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {canAddProduct && (
                          <Link href={`/products/new?barcode=${encodeURIComponent(scannedResult.scannedCode)}`}>
                            <Button className="w-full bg-blue-600 text-white font-bold text-xs">
                              <Plus className="w-3.5 h-3.5 mr-1" />
                              Add New Product
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => {
                            setScannedResult(null);
                            startCamera();
                          }}
                          className="w-full text-xs font-bold"
                        >
                          Scan Next Product
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Mobile Matched Product
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <Badge variant="blue" className="text-[10px]">
                            {scannedResult.matchType === 'MODERN_VARIANT' ? 'Variant' : 'Product'}
                          </Badge>
                          <h4 className="font-black text-base text-slate-900 mt-1">
                            {scannedResult.name || scannedResult.product_name}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            Barcode: #{scannedResult.barcode || scannedResult.scannedCode}
                          </p>
                        </div>
                        <span className="text-xs font-black text-emerald-600 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Detected</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Selling Price</span>
                          <span className="font-extrabold text-base text-slate-900">
                            {formatCurrency(scannedResult.unitPrice || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Available Stock</span>
                          <span
                            className={`font-extrabold text-base ${
                              Number(scannedResult.stockQuantity || 0) > 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {scannedResult.stockQuantity ?? 0} {scannedResult.unit || 'PCS'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <Button
                          type="button"
                          onClick={handleAddToSale}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl shadow-md"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1.5" />
                          Add to Sale (POS)
                        </Button>

                        <div className="grid grid-cols-2 gap-2">
                          <Link href={`/products/${scannedResult.productId || scannedResult.id}`}>
                            <Button variant="outline" className="w-full text-xs font-bold">
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Product
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setScannedResult(null);
                              startCamera();
                            }}
                            className="w-full text-xs font-bold"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" />
                            Scan Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              ) : null}
            </div>
          )}

          {/* Off-screen canvas helper for html5-qrcode */}
          <div className="hidden" aria-hidden="true">
            <div id="scanner-temp-canvas" />
          </div>

          {/* Manual Barcode Entry Modal */}
          {showManualModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">Enter Barcode Manually</h3>
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleManualModalSubmit} className="space-y-3">
                  <input
                    type="text"
                    autoFocus
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="Enter EAN, UPC, or SKU code..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowManualModal(false)}
                      className="text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!manualCodeInput.trim()}
                      className="bg-blue-600 text-white font-bold text-xs"
                    >
                      Lookup Code
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
