import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePet } from '@/features/pets/hooks/usePets';
import {
  QrCode,
  ArrowLeft,
  Share2,
  Printer,
  Shield,
  Heart,
  Phone,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { toast } from 'sonner';

export default function PetQRPage() {
  const { petId } = useParams<{ petId: string }>();
  const { data: pet, isLoading } = usePet(petId as string);

  if (isLoading) {
    return (
      <div className="container-page py-12 max-w-lg mx-auto">
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="container-page py-12 text-center text-muted">
        Pet not found.
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/public/pet/${pet.qrCode}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    publicUrl
  )}&bgcolor=ffffff&color=1e293b&qzone=2`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Public profile link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-page max-w-lg py-8 space-y-6">
      <Link
        to={`/pets/${pet._id}`}
        className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground mb-2"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {pet.name}'s Profile
      </Link>

      <div className="card p-6 border-border shadow-xl space-y-6 text-center print:shadow-none print:border-none">
        <div>
          <span className="badge bg-primary/10 text-primary border-primary/20 text-xs font-bold uppercase mb-2 inline-block">
            PetVerse Smart Collar Tag
          </span>
          <h1 className="text-2xl font-black text-foreground">{pet.name}'s Identity Tag</h1>
          <p className="text-xs text-muted mt-1">
            Anyone who scans this QR code can instantly see emergency contact details and medical alerts.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-6 bg-white rounded-3xl shadow-inner border border-border inline-block mx-auto">
          <img
            src={qrImageUrl}
            alt={`${pet.name} QR Code`}
            className="w-56 h-56 mx-auto object-contain"
          />
        </div>

        <div className="bg-surface-2 p-3.5 rounded-2xl border border-border text-xs space-y-1.5 text-left">
          <div className="flex justify-between text-muted">
            <span>Tag ID:</span>
            <span className="font-mono text-foreground font-semibold truncate max-w-[200px]">
              {pet.qrCode}
            </span>
          </div>
          {pet.microchipId && (
            <div className="flex justify-between text-muted">
              <span>Microchip:</span>
              <span className="font-mono text-foreground font-semibold">{pet.microchipId}</span>
            </div>
          )}
          <div className="flex justify-between text-muted">
            <span>Breed:</span>
            <span className="text-foreground font-semibold">{pet.breed || 'Unknown'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-center print:hidden">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-surface-2 hover:bg-surface-3 text-foreground text-xs font-semibold rounded-xl border border-border transition flex-1 justify-center"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Link
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20 flex-1 justify-center"
          >
            <Printer className="w-3.5 h-3.5" /> Print Collar Tag
          </button>
        </div>

        <div className="text-[11px] text-muted flex items-center justify-center gap-1 print:hidden">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span>Privacy protected: Owner address and private records remain hidden.</span>
        </div>
      </div>
    </div>
  );
}