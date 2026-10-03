import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { aiApi, type BreedScanResponse } from '@/services/api/aiApi';
import {
  Camera,
  UploadCloud,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Activity,
  Heart,
  Scissors,
  Scale,
  Calendar,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BreedScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BreedScanResponse | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPEG, PNG, or WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageBase64) {
      toast.error('Please upload a pet photo first.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await aiApi.identifyBreed({
        species,
        imageBase64,
      });
      setResult(data);
    } catch {
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-page py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/ai"
          className="p-2 rounded-xl border border-border hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
            <Camera className="h-6 w-6 text-purple-500" />
            Visual Breed Scanner & Genetic Lineage
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Identify pet breeds, physical traits, and hereditary health predispositions using visual recognition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 border-border">
            <h2 className="text-sm font-bold text-foreground mb-4">Select Pet Type</h2>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => setSpecies('dog')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  species === 'dog'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground'
                }`}
              >
                Dog (Canine)
              </button>
              <button
                type="button"
                onClick={() => setSpecies('cat')}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                  species === 'cat'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground'
                }`}
              >
                Cat (Feline)
              </button>
            </div>

            <h2 className="text-sm font-bold text-foreground mb-2">Upload Pet Photo</h2>
            <p className="text-xs text-muted mb-4">
              Clear, well-lit photos showing your pet's face and body yield the highest accuracy.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-surface-2/40 group flex flex-col items-center justify-center min-h-[200px]"
            >
              {imagePreview ? (
                <div className="relative w-full max-h-56 overflow-hidden rounded-xl">
                  <img
                    src={imagePreview}
                    alt="Pet Preview"
                    className="w-full h-48 object-cover rounded-xl shadow-sm"
                  />
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                    Click to change
                  </span>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-full bg-surface-3 group-hover:scale-110 transition-transform mb-3 text-muted group-hover:text-primary">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">Click to upload photo</p>
                  <p className="text-[11px] text-muted mt-1">Supports PNG, JPG, WebP up to 10MB</p>
                </>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={isLoading || !imageBase64}
              className="btn-primary w-full mt-6 py-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Analyzing Breed Patterns...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Identify Breed & Characteristics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Breed Results Column */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="space-y-6 animate-fade-in">
              {/* Primary Breed Card */}
              <div className="card p-6 border-border bg-gradient-to-br from-surface-1 to-surface-2 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      Primary Match ({result.confidence}% Confidence)
                    </span>
                    <h2 className="text-2xl font-extrabold text-foreground mt-0.5">
                      {result.primaryBreed}
                    </h2>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary font-black">
                    <span className="text-base">{Math.round(result.confidence)}%</span>
                    <span className="text-[9px] uppercase font-bold text-muted">Match</span>
                  </div>
                </div>

                {/* Secondary Matches */}
                {result.secondaryBreeds && result.secondaryBreeds.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-border">
                    <p className="text-[11px] text-muted font-semibold mb-2">Secondary Lineage Markers:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.secondaryBreeds.map((sec, idx) => (
                        <span
                          key={idx}
                          className="badge text-xs px-2.5 py-1 bg-surface-2 text-foreground/80 border-border"
                        >
                          {sec.breed} ({sec.confidence}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trait Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border text-center">
                  <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                    <Activity className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                    <span className="text-[10px] text-muted block">Energy Level</span>
                    <span className="text-xs font-bold text-foreground">
                      {result.characteristics.energyLevel}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                    <Scissors className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                    <span className="text-[10px] text-muted block">Grooming</span>
                    <span className="text-xs font-bold text-foreground">
                      {result.characteristics.groomingNeeds.split(' ')[0]}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                    <Scale className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                    <span className="text-[10px] text-muted block">Adult Weight</span>
                    <span className="text-xs font-bold text-foreground">
                      {result.characteristics.typicalWeightRangeKg.min}-
                      {result.characteristics.typicalWeightRangeKg.max} kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                    <Calendar className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                    <span className="text-[10px] text-muted block">Lifespan</span>
                    <span className="text-xs font-bold text-foreground">
                      {result.characteristics.lifeExpectancyYears.min}-
                      {result.characteristics.lifeExpectancyYears.max} yrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Temperament */}
              <div className="card p-5 border-border">
                <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Temperament & Personality Profile
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.characteristics.temperament.map((trait, idx) => (
                    <span
                      key={idx}
                      className="badge bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-1"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Health Predispositions */}
              <div className="card p-5 border-border">
                <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Hereditary Health Screenings to Discuss with Vet
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {result.healthConsiderations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-foreground/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Care Tips */}
              <div className="card p-5 border-border">
                <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Personalized Care Guidelines
                </h3>
                <ul className="space-y-1.5 text-xs text-muted">
                  {result.careTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-foreground/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-surface-2/60 border border-border rounded-xl text-[11px] text-muted flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                <p className="leading-relaxed">{result.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="card p-12 border-border border-dashed text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="p-4 rounded-2xl bg-surface-2 mb-4 text-muted">
                <Camera className="h-8 w-8 text-purple-500/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">Upload a Photo to Begin</h3>
              <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
                Take or upload a picture of your dog or cat. The visual AI model will detect facial landmarks, coat patterns, and body proportions to estimate breed lineage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}