import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePet } from '@/features/pets/hooks/usePets';
import { calculateAge } from '@/shared/utils/date';
import QRCode from 'qrcode';
import {
  QrCode,
  ArrowLeft,
  Share2,
  Printer,
  Shield,
  AlertTriangle,
  Download,
  CheckCircle2,
  Scissors,
  PawPrint,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { toast } from 'sonner';
import type { IPet } from '@petverse/shared-types';

type TagFormat = 'collar' | 'wallet' | 'sheet';

export default function PetQRPage() {
  const { petId } = useParams<{ petId: string }>();
  const { data: pet, isLoading } = usePet(petId as string);

  const [activeFormat, setActiveFormat] = useState<TagFormat>('collar');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Compute exact public profile URL (PetVerse Public Route)
  const publicUrl = useMemo(() => {
    if (!pet?.qrCode) return '';
    return `${window.location.origin}/public/pet/${pet.qrCode}`;
  }, [pet?.qrCode]);

  // Generate offline, high-resolution QR data URL whenever pet changes
  useEffect(() => {
    let isMounted = true;

    // Reset when pet changes to avoid retaining previous pet QR
    setQrDataUrl('');
    setImgError(false);

    if (!publicUrl) {
      setIsGeneratingQr(false);
      return;
    }

    setIsGeneratingQr(true);
    setQrError(null);

    // High error-correction level (H) and high pixel resolution for crisp printing
    QRCode.toDataURL(publicUrl, {
      width: 600,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#0f172a', // Deep slate for maximum scanner contrast
        light: '#ffffff', // Pure white background for print fidelity
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGeneratingQr(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          console.error('Failed to generate pet QR code:', err);
          setQrError('Failed to generate high-resolution QR tag.');
          setIsGeneratingQr(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [publicUrl]);

  if (isLoading) {
    return (
      <div className="container-page py-12 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-[460px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container-page py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Pet Not Found</h1>
        <p className="text-sm text-muted">
          The requested pet profile does not exist or has been removed.
        </p>
        <Link
          to="/pets"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Return to My Pets
        </Link>
      </div>
    );
  }

  const age = pet.dob ? calculateAge(pet.dob) : pet.estimatedAge || 'Unknown';
  const hasMedicalAlerts =
    (pet.allergies && pet.allergies.length > 0) ||
    (pet.currentMedications && pet.currentMedications.length > 0) ||
    (pet.chronicDiseases && pet.chronicDiseases.length > 0);

  const handleCopyLink = () => {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Public profile link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (!qrDataUrl) {
      toast.error('QR code is still preparing. Please wait a moment.');
      return;
    }
    window.print();
  };

  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `${pet.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-petverse-qr.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('High-resolution QR code downloaded!');
  };

  const handleDownloadCardImage = async () => {
    if (!qrDataUrl) return;
    setIsDownloading(true);

    try {
      // Render tag onto a high-DPI canvas (1200x750)
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 750;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas context unavailable');

      // Fill Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer Border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 16, canvas.width - 32, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('PETVERSE • OFFICIAL PET ID TAG', 50, 78);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('24/7 EMERGENCY SAFETY & RECOVERY NETWORK', 50, 104);

      // Pet Name & Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(pet.name, 50, 185);

      ctx.fillStyle = '#2563eb';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const breedSpecies = `${pet.breed ? `${pet.breed} ` : ''}${pet.species}`.toUpperCase();
      ctx.fillText(breedSpecies, 50, 225);

      ctx.fillStyle = '#475569';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`GENDER: ${pet.gender.toUpperCase()}   •   AGE: ${age.toUpperCase()}`, 50, 265);

      if (pet.color) {
        ctx.fillText(`COLOR: ${pet.color.toUpperCase()}`, 50, 295);
      }
      if (pet.weight) {
        ctx.fillText(`WEIGHT: ${pet.weight} KG`, 50, 325);
      }

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`TAG ID: ${pet.qrCode}`, 50, 365);
      if (pet.microchipId) {
        ctx.fillText(`MICROCHIP: ${pet.microchipId}`, 50, 395);
      }

      // Medical Alert Section
      if (hasMedicalAlerts || pet.isLost) {
        ctx.fillStyle = '#fef2f2';
        ctx.fillRect(50, 420, 600, 100);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 420, 600, 100);

        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('⚠️ MEDICAL / RECOVERY ALERT', 70, 455);

        ctx.fillStyle = '#991b1b';
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const alertsText = [
          pet.allergies?.length ? `Allergies: ${pet.allergies.join(', ')}` : '',
          pet.currentMedications?.length ? `Meds: ${pet.currentMedications.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join(' | ');
        ctx.fillText(alertsText.slice(0, 56) || 'Check profile for medical details', 70, 490);
      } else {
        ctx.fillStyle = '#f0fdf4';
        ctx.fillRect(50, 420, 600, 70);
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(50, 420, 600, 70);

        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('✓ DIGITAL SAFETY PROFILE ACTIVE', 70, 462);
      }

      // Draw QR Code
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });

      // QR container box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(720, 140, 420, 480);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(720, 140, 420, 480);

      // QR Image
      ctx.drawImage(qrImg, 760, 160, 340, 340);

      // QR Instructions
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('IF FOUND, PLEASE SCAN', 930, 535);

      ctx.fillStyle = '#475569';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Scan with smartphone to contact owner', 930, 570);
      ctx.textAlign = 'left';

      // Footer Banner
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(16, canvas.height - 80, canvas.width - 32, 64);

      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Helping pets find their way home. • PetVerse Safety Network • petverse.app', 50, canvas.height - 40);

      const downloadUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${pet.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-petverse-id-card.png`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Pet ID Card image downloaded successfully!');
    } catch (err) {
      console.error('Canvas export error:', err);
      // Fallback to QR only download
      handleDownloadQrOnly();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container-page py-6 max-w-4xl mx-auto space-y-6">
      {/* ─── Screen-Only Navigation & Control Bar ─── */}
      <div className="no-print space-y-4">
        {/* Back Link */}
        <Link
          to={`/pets/${pet._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to {pet.name}'s Profile
        </Link>

        {/* Header Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge bg-primary/10 text-primary border-primary/20 text-[11px] font-bold uppercase tracking-wider">
                Official PetVerse Safety
              </span>
              {pet.isLost && (
                <span className="badge bg-rose-500/10 text-rose-600 border-rose-500/20 text-[11px] font-bold uppercase animate-pulse">
                  Lost Pet Active
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {pet.name}'s Identity Tag
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5">
              Veterinary-grade QR identification tag and wallet card with instant emergency recovery routing.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-surface-2 border border-border text-xs text-muted shrink-0">
            <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="block font-semibold text-foreground">Scannable 24/7</span>
              <span className="text-[10px]">Directs to verified profile</span>
            </div>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-2 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setActiveFormat('collar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none justify-center ${
              activeFormat === 'collar'
                ? 'bg-surface text-foreground shadow-sm border border-border/80'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <PawPrint className="w-3.5 h-3.5 text-primary" />
            Smart Collar Tag
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('wallet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none justify-center ${
              activeFormat === 'wallet'
                ? 'bg-surface text-foreground shadow-sm border border-border/80'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-primary" />
            Veterinary Wallet ID
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat('sheet')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none justify-center ${
              activeFormat === 'sheet'
                ? 'bg-surface text-foreground shadow-sm border border-border/80'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 text-primary" />
            A4 Multi-Tag Sheet
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* PRIMARY PRINT BUTTON */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGeneratingQr || !qrDataUrl}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
            aria-label="Print Pet QR Tag"
          >
            <Printer className="w-4 h-4" />
            {isGeneratingQr ? 'Preparing Tag...' : 'Print QR Tag'}
          </button>

          {/* DOWNLOAD CARD BUTTON */}
          <button
            type="button"
            onClick={handleDownloadCardImage}
            disabled={isGeneratingQr || isDownloading || !qrDataUrl}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface-3 active:scale-[0.98] transition-all text-xs font-semibold disabled:opacity-50 flex-1 sm:flex-none"
            aria-label="Download Pet ID Card image"
          >
            <Download className="w-4 h-4 text-primary" />
            {isDownloading ? 'Saving...' : 'Download Card'}
          </button>

          {/* DOWNLOAD QR BUTTON */}
          <button
            type="button"
            onClick={handleDownloadQrOnly}
            disabled={isGeneratingQr || !qrDataUrl}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface-3 active:scale-[0.98] transition-all text-xs font-semibold disabled:opacity-50 flex-1 sm:flex-none"
            aria-label="Download QR Code only"
          >
            <QrCode className="w-4 h-4 text-primary" />
            Download QR
          </button>

          {/* SHARE / COPY LINK BUTTON */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-surface-2 border border-border text-foreground hover:bg-surface-3 active:scale-[0.98] transition-all text-xs font-semibold flex-1 sm:flex-none"
            aria-label="Copy public safety link"
          >
            {copied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <Share2 className="w-4 h-4 text-muted" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* ─── PRINT PREVIEW & TARGET CONTAINER ─── */}
      <div id="pet-qr-print-target" className="w-full">
        {/* Render Format 1: Smart Collar Tag */}
        {activeFormat === 'collar' && (
          <div className="w-full flex justify-center">
            <CollarTagCard
              pet={pet}
              age={age}
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
              imgError={imgError}
              setImgError={setImgError}
              hasMedicalAlerts={hasMedicalAlerts}
            />
          </div>
        )}

        {/* Render Format 2: Veterinary Wallet Card */}
        {activeFormat === 'wallet' && (
          <div className="w-full flex justify-center">
            <WalletIdCard
              pet={pet}
              age={age}
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
              imgError={imgError}
              setImgError={setImgError}
              hasMedicalAlerts={hasMedicalAlerts}
            />
          </div>
        )}

        {/* Render Format 3: A4 Multi-Tag Sheet */}
        {activeFormat === 'sheet' && (
          <div className="w-full flex justify-center">
            <MultiTagPrintSheet
              pet={pet}
              age={age}
              qrDataUrl={qrDataUrl}
              publicUrl={publicUrl}
              imgError={imgError}
              setImgError={setImgError}
              hasMedicalAlerts={hasMedicalAlerts}
            />
          </div>
        )}
      </div>

      {/* ─── Screen-Only Print Tips & Privacy Notice ─── */}
      <div className="no-print space-y-3 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Printing Tips Card */}
          <div className="p-4 rounded-2xl bg-surface-2/60 border border-border/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Pro Printing Instructions
            </div>
            <ul className="text-muted list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>
                In the browser print dialog, enable <strong>"Background graphics"</strong> for crisp badge colors.
              </li>
              <li>
                For collar tags, print on heavy cardstock (200-300 GSM) and thermal laminate for waterproof protection.
              </li>
              <li>
                Use a standard single hole punch at the circular guideline and attach with a stainless steel split ring.
              </li>
            </ul>
          </div>

          {/* Privacy & Safety Guarantee */}
          <div className="p-4 rounded-2xl bg-surface-2/60 border border-border/80 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Shield className="w-4 h-4 text-emerald-500" />
              Privacy & Security Guaranteed
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              The printed tag only displays medical and identification essentials. Scanning the QR code routes to
              PetVerse's secure public safety gateway, keeping your home address and private billing details confidential.
            </p>
            <div className="pt-1">
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-semibold"
              >
                Preview live public profile <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT 1: SMART COLLAR TAG
// ─────────────────────────────────────────────────────────────
interface TagProps {
  pet: IPet;
  age: string;
  qrDataUrl: string;
  publicUrl: string;
  imgError: boolean;
  setImgError: (err: boolean) => void;
  hasMedicalAlerts: boolean;
}

function CollarTagCard({
  pet,
  age,
  qrDataUrl,
  publicUrl,
  imgError,
  setImgError,
  hasMedicalAlerts,
}: TagProps) {
  return (
    <div
      data-print-card
      className="w-full max-w-sm bg-white text-slate-900 border-2 border-slate-300 rounded-3xl p-5 shadow-xl space-y-4 print:shadow-none print:border-slate-800 print:m-0 print:p-5 print:max-w-[76mm] print:w-[76mm] print-avoid-break"
    >
      {/* Hole Punch Ring Guide (for collar split ring) */}
      <div className="flex flex-col items-center justify-center pt-0.5">
        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center bg-slate-50">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
        </div>
        <span className="text-[8px] font-mono font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
          ✂ Punch Hole for Ring
        </span>
      </div>

      {/* Header Branding */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            <PawPrint className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[11px] font-black tracking-wider uppercase text-slate-900 leading-tight">
              PETVERSE PET ID
            </span>
            <span className="block text-[8px] font-medium text-slate-500 uppercase tracking-widest">
              Digital Safety Collar Tag
            </span>
          </div>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
          OFFICIAL ID
        </span>
      </div>

      {/* Pet Photo & Core Identity */}
      <div className="flex items-center gap-3">
        {/* Real Pet Photo with clean fallback */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
          {pet.avatar && !imgError ? (
            <img
              src={pet.avatar}
              alt={`${pet.name} photo`}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 p-1">
              <PawPrint className="w-6 h-6 text-slate-400" />
              <span className="text-[9px] font-black uppercase text-slate-500 mt-0.5">
                {pet.species}
              </span>
            </div>
          )}
        </div>

        {/* Pet Name & Primary Info */}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
            {pet.name}
          </h2>
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide truncate">
            {pet.breed ? `${pet.breed} ` : ''}
            {pet.species}
          </p>
          <div className="text-[10px] text-slate-600 space-y-0.5 mt-1 font-medium">
            <div className="flex justify-between">
              <span>Gender:</span>
              <span className="font-semibold text-slate-800 capitalize">{pet.gender}</span>
            </div>
            <div className="flex justify-between">
              <span>Age:</span>
              <span className="font-semibold text-slate-800">{age}</span>
            </div>
            {pet.microchipId && (
              <div className="flex justify-between">
                <span>Chip:</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[110px]">
                  {pet.microchipId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-200 text-center space-y-2">
        <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
          IF FOUND, PLEASE SCAN
        </div>

        {/* High Scannability QR Image */}
        <div className="w-36 h-36 mx-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`${pet.name} Safety QR Code`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 rounded-lg">
              <Skeleton className="w-28 h-28" />
            </div>
          )}
        </div>

        <p className="text-[9px] font-semibold text-slate-700">
          Scan to view owner contact & medical profile
        </p>
        <p className="text-[8px] font-mono text-slate-500 tracking-tight truncate max-w-[220px] mx-auto">
          {publicUrl.replace(/^https?:\/\//, '')}
        </p>
      </div>

      {/* Medical / Emergency Status Alert */}
      {pet.isLost ? (
        <div className="bg-rose-50 border border-rose-300 p-2 rounded-xl text-center">
          <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider block">
            ⚠️ LOST PET REPORTED
          </span>
          <span className="text-[9px] text-rose-800 font-medium">
            Please scan immediately to reunite with family!
          </span>
        </div>
      ) : hasMedicalAlerts ? (
        <div className="bg-amber-50 border border-amber-300 p-2 rounded-xl text-[9px] text-amber-900 leading-tight">
          <span className="font-bold uppercase text-amber-800 block">⚠️ Medical Alert</span>
          {pet.allergies && pet.allergies.length > 0 && (
            <span className="block truncate">Allergies: {pet.allergies.join(', ')}</span>
          )}
          {pet.currentMedications && pet.currentMedications.length > 0 && (
            <span className="block truncate">Meds: {pet.currentMedications.join(', ')}</span>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between text-[9px] text-slate-600 px-1">
          <span className="font-semibold">Tag ID: {pet.qrCode}</span>
          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Profile
          </span>
        </div>
      )}

      {/* Footer Branding Statement */}
      <div className="border-t border-slate-200 pt-2 text-center">
        <span className="text-[8px] font-semibold text-slate-500 uppercase tracking-widest block">
          Helping pets find their way home.
        </span>
        <span className="text-[7px] text-slate-400 font-medium">
          PetVerse Emergency Safety Network • petverse.app
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT 2: VETERINARY WALLET ID CARD (CR80 Standard)
// ─────────────────────────────────────────────────────────────
function WalletIdCard({
  pet,
  age,
  qrDataUrl,
  publicUrl,
  imgError,
  setImgError,
  hasMedicalAlerts,
}: TagProps) {
  return (
    <div
      data-print-card
      className="w-full max-w-xl bg-white text-slate-900 border-2 border-slate-300 rounded-3xl overflow-hidden shadow-xl print:shadow-none print:border-slate-800 print:m-0 print:max-w-[100mm] print:w-[100mm] print-avoid-break"
    >
      {/* Top Professional Header Bar */}
      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
            <PawPrint className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-xs font-black tracking-wider uppercase text-white leading-tight">
              PETVERSE VETERINARY ID
            </span>
            <span className="block text-[8px] font-medium text-slate-400 uppercase tracking-widest">
              Digital Pet Identification Card
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            REGISTERED MEMBER
          </span>
        </div>
      </div>

      {/* Main 2-Column Body */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Left Column: Photo & Details (3 cols) */}
        <div className="sm:col-span-3 space-y-3">
          <div className="flex items-start gap-3">
            {/* Real Pet Photo */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
              {pet.avatar && !imgError ? (
                <img
                  src={pet.avatar}
                  alt={`${pet.name} photo`}
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <PawPrint className="w-7 h-7 text-slate-400" />
                  <span className="text-[9px] font-bold uppercase mt-0.5">{pet.species}</span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight truncate">
                {pet.name}
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide truncate">
                {pet.breed ? `${pet.breed} ` : ''}
                {pet.species}
              </p>
              <p className="text-[11px] font-semibold text-slate-600 capitalize mt-0.5">
                {pet.gender} • {age}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[10px] space-y-1 font-medium text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Tag ID:</span>
              <span className="font-mono font-bold text-slate-900">{pet.qrCode}</span>
            </div>
            {pet.microchipId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Microchip:</span>
                <span className="font-mono font-bold text-slate-900">{pet.microchipId}</span>
              </div>
            )}
            {pet.color && (
              <div className="flex justify-between">
                <span className="text-slate-500">Color / Markings:</span>
                <span className="font-semibold text-slate-900">{pet.color}</span>
              </div>
            )}
            {pet.weight && (
              <div className="flex justify-between">
                <span className="text-slate-500">Weight:</span>
                <span className="font-semibold text-slate-900">{pet.weight} kg</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Vaccinated:</span>
              <span className="font-semibold text-slate-900">
                {pet.isVaccinated ? 'Yes (Up to date)' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code & Scan instructions (2 cols) */}
        <div className="sm:col-span-2 flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5">
          <span className="text-[9px] font-black uppercase tracking-wider text-rose-600">
            IF FOUND, PLEASE SCAN
          </span>

          <div className="w-28 h-28 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`${pet.name} Safety QR Code`}
                className="w-full h-full object-contain"
              />
            ) : (
              <Skeleton className="w-24 h-24" />
            )}
          </div>

          <span className="text-[8px] font-semibold text-slate-600 leading-tight">
            Instant camera scan opens owner emergency contacts
          </span>
        </div>
      </div>

      {/* Medical Alert Strip */}
      {hasMedicalAlerts && (
        <div className="mx-5 mb-4 bg-amber-50 border border-amber-300 p-2.5 rounded-xl text-[10px] text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-bold uppercase tracking-wide block">Medical Alerts:</span>
            {pet.allergies && pet.allergies.length > 0 && (
              <span>Allergies: {pet.allergies.join(', ')}. </span>
            )}
            {pet.currentMedications && pet.currentMedications.length > 0 && (
              <span>Medications: {pet.currentMedications.join(', ')}. </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Banner */}
      <div className="bg-slate-100 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-[8px] text-slate-500 font-medium">
        <span>Helping pets find their way home.</span>
        <span>PetVerse 24/7 Digital Safety • petverse.app</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBCOMPONENT 3: A4 MULTI-TAG CUTOUT PRINT SHEET
// ─────────────────────────────────────────────────────────────
function MultiTagPrintSheet({
  pet,
  age,
  qrDataUrl,
  publicUrl,
  imgError,
  setImgError,
  hasMedicalAlerts,
}: TagProps) {
  return (
    <div
      data-print-card
      className="w-full max-w-3xl bg-white text-slate-900 border-2 border-slate-300 rounded-3xl p-6 shadow-xl space-y-6 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-full print:w-full print-avoid-break"
    >
      {/* Printable Sheet Header */}
      <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <PawPrint className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-black tracking-wider uppercase text-slate-900">
              PETVERSE • OFFICIAL PRINTABLE IDENTIFICATION SHEET
            </h1>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Safety tag set for <strong>{pet.name}</strong> • Print on heavy cardstock (200-300 GSM) or laminate for waterproof durability.
          </p>
        </div>
        <div className="text-right text-[9px] font-mono font-bold text-slate-700">
          <div>TAG: {pet.qrCode}</div>
          {pet.microchipId && <div>CHIP: {pet.microchipId}</div>}
        </div>
      </div>

      {/* Cutout Instructions Bar */}
      <div className="bg-slate-50 border border-dashed border-slate-300 p-2.5 rounded-xl flex items-center gap-2 text-[10px] text-slate-600">
        <Scissors className="w-4 h-4 text-slate-500 shrink-0" />
        <span>
          <strong>Cut along dashed lines (✂).</strong> Punch hole at circular marks for collar rings. Store the wallet card in your purse or car glovebox.
        </span>
      </div>

      {/* Grid of Cutout Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* CUTOUT 1: Standard Collar Tag */}
        <div className="border-2 border-dashed border-slate-400 rounded-3xl p-3 relative bg-slate-50/50">
          <span className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-mono font-bold text-slate-600 flex items-center gap-1 border border-slate-300 rounded">
            <Scissors className="w-3 h-3" /> Cutout 1: Collar Tag
          </span>
          <CollarTagCard
            pet={pet}
            age={age}
            qrDataUrl={qrDataUrl}
            publicUrl={publicUrl}
            imgError={imgError}
            setImgError={setImgError}
            hasMedicalAlerts={hasMedicalAlerts}
          />
        </div>

        {/* CUTOUT 2: Wallet ID Card */}
        <div className="border-2 border-dashed border-slate-400 rounded-3xl p-3 relative bg-slate-50/50">
          <span className="absolute -top-2.5 left-4 bg-white px-2 text-[9px] font-mono font-bold text-slate-600 flex items-center gap-1 border border-slate-300 rounded">
            <Scissors className="w-3 h-3" /> Cutout 2: Wallet Card
          </span>
          <WalletIdCard
            pet={pet}
            age={age}
            qrDataUrl={qrDataUrl}
            publicUrl={publicUrl}
            imgError={imgError}
            setImgError={setImgError}
            hasMedicalAlerts={hasMedicalAlerts}
          />
        </div>
      </div>

      {/* Sheet Footer Notes */}
      <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[8px] text-slate-500 font-medium">
        <span>PetVerse Emergency Lost & Found Safety Network</span>
        <span>Verify status anytime at petverse.app</span>
      </div>
    </div>
  );
}