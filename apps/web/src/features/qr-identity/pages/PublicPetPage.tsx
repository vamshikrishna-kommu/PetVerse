import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/shared/lib/axios';
import {
  PawPrint,
  Heart,
  Phone,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';

interface PublicPetData {
  _id: string;
  name: string;
  species: string;
  breed?: string;
  gender?: string;
  color?: string;
  avatar?: string;
  microchipId?: string;
  allergies?: string[];
  currentMedications?: string[];
  behaviorNotes?: string;
  isLost?: boolean;
}

export default function PublicPetPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [pet, setPet] = useState<PublicPetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!qrCode) return;
    setIsLoading(true);
    api
      .get<{ success: boolean; data: PublicPetData }>(`/public/pet/${qrCode}`)
      .then((res) => {
        setPet(res.data.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [qrCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="min-h-screen bg-surface-2 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Tag Not Recognized</h1>
          <p className="text-xs text-muted leading-relaxed">
            The scanned PetVerse QR tag was not found in our database. It may be inactive or registered under a different ID.
          </p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-md"
          >
            Visit PetVerse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-2 py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase mb-1">
            <PawPrint className="w-3.5 h-3.5" /> PetVerse Digital Collar
          </div>
        </div>

        {/* Main Identity Card */}
        <div className="card overflow-hidden border-border shadow-2xl space-y-5">
          {/* Pet Photo Header */}
          <div className="relative h-64 bg-gradient-to-br from-primary/20 via-surface to-accent/20 flex items-center justify-center">
            {pet.avatar ? (
              <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <PawPrint className="w-24 h-24 text-primary/30" />
            )}

            {pet.isLost && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-danger text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> LOST PET ALERT
              </div>
            )}
          </div>

          <div className="p-6 pt-0 space-y-5">
            <div>
              <h1 className="text-2xl font-black text-foreground">{pet.name}</h1>
              <p className="text-xs text-muted capitalize">
                {pet.gender} • {pet.species} • {pet.breed || 'Mixed Breed'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {pet.color && (
                <div className="bg-surface-2 p-2.5 rounded-xl border border-border">
                  <span className="text-muted block text-[10px] uppercase font-bold">Color</span>
                  <span className="font-semibold text-foreground">{pet.color}</span>
                </div>
              )}
              {pet.microchipId && (
                <div className="bg-surface-2 p-2.5 rounded-xl border border-border">
                  <span className="text-muted block text-[10px] uppercase font-bold">Microchip ID</span>
                  <span className="font-mono font-semibold text-foreground text-[11px] truncate block">
                    {pet.microchipId}
                  </span>
                </div>
              )}
            </div>

            {/* Medical Alerts (Vital for finders/rescuers) */}
            {((pet.allergies && pet.allergies.length > 0) ||
              (pet.currentMedications && pet.currentMedications.length > 0)) && (
              <div className="p-3.5 rounded-xl bg-danger/5 border border-danger/20 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-danger">
                  <ShieldAlert className="w-4 h-4" /> Medical & Dietary Cautions
                </div>
                {pet.allergies && pet.allergies.length > 0 && (
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-foreground">Allergies: </span>
                    {pet.allergies.join(', ')}
                  </div>
                )}
                {pet.currentMedications && pet.currentMedications.length > 0 && (
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-foreground">Medications: </span>
                    {pet.currentMedications.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Behavior & Notes */}
            {pet.behaviorNotes && (
              <div className="bg-surface-2 p-3 rounded-xl text-xs text-muted italic">
                "{pet.behaviorNotes}"
              </div>
            )}

            {/* Finder Instructions Card */}
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 text-xs text-muted">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-primary" /> If you have found {pet.name}:
              </h4>
              <p className="leading-relaxed text-[11px]">
                Please keep {pet.name} safe and sheltered. If the pet requires urgent medical care, any licensed veterinary clinic can scan the microchip and provide shelter.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-muted">
          Protected by <strong className="text-foreground">PetVerse Smart Tag Ecosystem</strong>
        </div>
      </div>
    </div>
  );
}