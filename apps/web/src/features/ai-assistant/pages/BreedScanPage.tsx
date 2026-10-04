import { useState, useRef, useEffect } from 'react';
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
  Dna,
} from 'lucide-react';
import { toast } from 'sonner';

const SCAN_STAGES = [
  { label: 'Preparing image payload',   from: 0,  to: 12,  duration: 600  },
  { label: 'Uploading to vision model', from: 12, to: 28,  duration: 1200 },
  { label: 'Running visual AI scan',    from: 28, to: 55,  duration: 3500 },
  { label: 'Decoding genetic markers',  from: 55, to: 75,  duration: 3000 },
  { label: 'Matching breed database',   from: 75, to: 88,  duration: 2500 },
  { label: 'Finalizing report',         from: 88, to: 88,  duration: 99999 }, // holds until API responds
];

export default function BreedScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BreedScanResponse | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageLabel, setScanStageLabel] = useState('');
  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Animate progress through stages while scan is running
  useEffect(() => {
    if (!isLoading) return;
    setScanProgress(0);
    setScanStageLabel(SCAN_STAGES[0].label);
    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    SCAN_STAGES.forEach((stage) => {
      const t = setTimeout(() => {
        setScanStageLabel(stage.label);
        // Smoothly interpolate from stage.from to stage.to
        const steps = 30;
        const stepSize = (stage.to - stage.from) / steps;
        const stepMs = stage.duration / steps;
        for (let i = 0; i <= steps; i++) {
          const st = setTimeout(() => {
            setScanProgress(Math.min(stage.from + stepSize * i, stage.to));
          }, stepMs * i);
          timers.push(st);
        }
      }, elapsed);
      timers.push(t);
      elapsed += stage.duration;
    });

    progressTimers.current = timers;
    return () => timers.forEach(clearTimeout);
  }, [isLoading]);

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
      setResult(null); // clear old result when new image selected
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageBase64) {
      toast.error('Please upload a pet photo first.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await aiApi.identifyBreed({
        species,
        imageBase64,
      });
      // Snap to 100% then show result
      progressTimers.current.forEach(clearTimeout);
      setScanProgress(100);
      setScanStageLabel('Analysis complete!');
      await new Promise((r) => setTimeout(r, 400));
      setResult(data);
    } catch {
      toast.error('Failed to analyze image. Please try again.');
    } finally {
      setIsLoading(false);
      setScanProgress(0);
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-surface-2/40 group flex flex-col items-center justify-center min-h-[190px]"
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

            {/* Mobile-friendly Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-3 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Camera className="h-4 w-4 text-purple-500" />
                Take Photo
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2.5 px-3 bg-surface-2 hover:bg-surface-3 border border-border rounded-xl text-xs font-semibold text-foreground flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <UploadCloud className="h-4 w-4 text-primary" />
                Choose Gallery
              </button>
            </div>

            <button
              onClick={handleScan}
              disabled={isLoading || !imageBase64}
              className="btn-primary w-full mt-6 py-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Identify Breed & Characteristics
                </>
              )}
            </button>

            {/* ── Progress Bar — visible while scanning ── */}
            {isLoading && (
              <div className="mt-5 space-y-2.5 animate-fade-in">
                {/* Stage label + percentage */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                    <Dna className="h-3 w-3 animate-pulse" />
                    {scanStageLabel}
                  </span>
                  <span className="text-[11px] font-black text-foreground tabular-nums">
                    {Math.round(scanProgress)}%
                  </span>
                </div>

                {/* Track */}
                <div className="relative h-2.5 w-full rounded-full bg-surface-3 overflow-hidden border border-border/60">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${scanProgress}%`,
                      background: 'linear-gradient(90deg, #a855f7, #6366f1, #3b82f6)',
                      boxShadow: '0 0 8px rgba(99,102,241,0.45)',
                    }}
                  />
                </div>

                {/* Milestone dots */}
                <div className="flex justify-between px-0.5">
                  {[12, 28, 55, 75, 88, 100].map((m) => (
                    <div
                      key={m}
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        scanProgress >= m
                          ? 'bg-indigo-500 scale-125'
                          : 'bg-border'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-[10px] text-muted text-center leading-relaxed">
                  Gemini Vision AI is analyzing your pet’s visual features — this may take 10–20s
                </p>
              </div>
            )}
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