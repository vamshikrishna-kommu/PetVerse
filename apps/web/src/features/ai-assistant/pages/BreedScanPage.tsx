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
  User,
  Box,
  Feather,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

const SCAN_STAGES = [
  { label: 'Analyzing image clarity & subject', from: 0,  to: 18, duration: 600  },
  { label: 'Running multimodal AI vision scan', from: 18, to: 45, duration: 1200 },
  { label: 'Classifying subject & species',     from: 45, to: 70, duration: 2500 },
  { label: 'Evaluating breed markers & traits',  from: 70, to: 88, duration: 2500 },
  { label: 'Finalizing diagnosis report',       from: 88, to: 88, duration: 99999 }, // holds until API responds
];

export default function BreedScanPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [species, setSpecies] = useState<'dog' | 'cat' | 'auto'>('auto');
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
    return () => {
      timers.forEach(clearTimeout);
    };
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

  const handleReset = () => {
    setResult(null);
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleScan = async () => {
    if (!imageBase64) {
      toast.error('Please upload a photo first.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await aiApi.identifyBreed({
        species: species === 'auto' ? undefined : species,
        imageBase64,
      });

      progressTimers.current.forEach(clearTimeout);
      setResult(data);
      setScanProgress(100);
      setScanStageLabel('Analysis complete!');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to analyze image. Please try again.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      setScanProgress(0);
    }
  };

  const getConfidencePercent = (conf?: number) => {
    if (typeof conf !== 'number') return 0;
    return Math.round(conf > 1 ? conf : conf * 100);
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
            Visual Breed Scanner & Multimodal AI
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Classifies dogs & cats with visual evidence reasoning, trait analysis, and non-pet recognition.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Controls Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 border-border">
            <h2 className="text-sm font-bold text-foreground mb-3">Target Subject (Optional)</h2>
            <div className="grid grid-cols-3 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setSpecies('auto')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                  species === 'auto'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground'
                }`}
              >
                ✨ Auto-Detect
              </button>
              <button
                type="button"
                onClick={() => setSpecies('dog')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                  species === 'dog'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground'
                }`}
              >
                🐶 Dog
              </button>
              <button
                type="button"
                onClick={() => setSpecies('cat')}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border transition-all text-center ${
                  species === 'cat'
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-muted border-border hover:text-foreground'
                }`}
              >
                🐱 Cat
              </button>
            </div>

            <h2 className="text-sm font-bold text-foreground mb-2">Upload Photo</h2>
            <p className="text-xs text-muted mb-4">
              Upload a clear, well-lit photo. The multimodal AI will determine if a dog or cat is present before identifying breed traits.
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
                Choose File
              </button>
            </div>

            <button
              data-testid="scan-breed-btn"
              onClick={handleScan}
              disabled={isLoading || !imageBase64}
              className="btn-primary w-full mt-6 py-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Scan Image with Gemini AI
                </>
              )}
            </button>

            {/* ── Progress Bar ── */}
            {isLoading && (
              <div className="mt-5 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                    <Dna className="h-3 w-3 animate-pulse" />
                    {scanStageLabel}
                  </span>
                  <span className="text-[11px] font-black text-foreground tabular-nums">
                    {Math.round(scanProgress)}%
                  </span>
                </div>

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

                <div className="flex justify-between px-0.5">
                  {[18, 45, 70, 88, 100].map((m) => (
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
                  Gemini multimodal vision is inspecting visual markers and subject classification
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {result ? (
            !result.isPetSupported ? (
              /* ── Unsupported Image Card (Person, Object, Other Animal, Unknown) ── */
              <div className="card p-8 border-border bg-gradient-to-br from-surface-1 to-surface-2 rounded-2xl text-center space-y-5 animate-fade-in shadow-sm">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                  {result.species === 'PERSON' && <User className="h-8 w-8 text-blue-500" />}
                  {result.species === 'OBJECT' && <Box className="h-8 w-8 text-amber-500" />}
                  {result.species === 'OTHER_ANIMAL' && <Feather className="h-8 w-8 text-emerald-500" />}
                  {result.species === 'UNKNOWN' && <HelpCircle className="h-8 w-8 text-rose-500" />}
                </div>

                <div>
                  <span className="badge px-3 py-1 text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border-amber-500/30">
                    {result.species === 'PERSON' && '👤 Person Detected'}
                    {result.species === 'OBJECT' && '📦 Object / Screen Detected'}
                    {result.species === 'OTHER_ANIMAL' && '🐾 Other Animal Detected'}
                    {result.species === 'UNKNOWN' && '❓ Subject Unclear'}
                  </span>
                  <h2 className="text-xl font-bold text-foreground mt-3">
                    {result.species === 'PERSON' && "This doesn't appear to be a dog or cat"}
                    {result.species === 'OBJECT' && 'No dog or cat found in this photo'}
                    {result.species === 'OTHER_ANIMAL' && 'Unsupported animal detected'}
                    {result.species === 'UNKNOWN' && "Couldn't identify a clear dog or cat"}
                  </h2>
                  <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">
                    {result.explanation ||
                      'Please upload a clear photo of a dog or cat for breed identification.'}
                  </p>
                </div>

                <div className="p-4 bg-surface-2/60 border border-border rounded-xl text-xs text-muted text-left max-w-md mx-auto space-y-1.5">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-primary" /> Tips for accurate breed identification:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted text-[11px]">
                    <li>Upload a clear photo containing exactly one dog or cat</li>
                    <li>Ensure adequate lighting showing facial and coat features</li>
                    <li>Avoid heavy filters, extreme crops, or blurred motion</li>
                  </ul>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleReset();
                      fileInputRef.current?.click();
                    }}
                    className="btn-primary px-6 py-2.5 text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Try Another Image
                  </button>
                </div>
              </div>
            ) : (
              /* ── Valid Breed Results Card ── */
              <div className="space-y-6 animate-fade-in">
                {/* Primary Breed Card */}
                <div className="card p-6 border-border bg-gradient-to-br from-surface-1 to-surface-2 rounded-2xl shadow-sm">
                  <div className="flex items-start justify-between mb-4 gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="badge text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary border-primary/20">
                          {result.species === 'CAT' ? '🐱 Feline' : '🐶 Canine'}
                        </span>
                        {result.uncertain && (
                          <span className="badge text-[10px] uppercase font-bold tracking-wider bg-amber-500/15 text-amber-500 border-amber-500/30">
                            ⚠️ Uncertain / Mixed Lineage
                          </span>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                          Visual Match ({getConfidencePercent(result.confidence)}%)
                        </span>
                      </div>
                      <h2 className="text-2xl font-extrabold text-foreground">
                        {result.breed || result.primaryBreed || 'Unknown Breed'}
                      </h2>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center text-primary font-black shrink-0">
                      <span className="text-base">{getConfidencePercent(result.confidence)}%</span>
                      <span className="text-[9px] uppercase font-bold text-muted">Match</span>
                    </div>
                  </div>

                  {/* Visual Evidence Explanation */}
                  {result.explanation && (
                    <div className="p-3.5 bg-surface-2/70 border border-border rounded-xl text-xs text-foreground/90 leading-relaxed mb-4">
                      <p className="font-semibold text-primary text-[11px] mb-1">Visual Evidence:</p>
                      {result.explanation}
                    </div>
                  )}

                  {/* Visual Traits */}
                  {result.characteristics?.visualTraits && result.characteristics.visualTraits.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] text-muted font-semibold mb-2">Observed Visual Traits:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.characteristics.visualTraits.map((trait, idx) => (
                          <span
                            key={idx}
                            className="badge text-xs px-2.5 py-1 bg-surface-3 text-foreground/90 border-border"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                            {sec.breed} ({getConfidencePercent(sec.confidence)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trait Matrix */}
                  {result.characteristics && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border text-center">
                      <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                        <Activity className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted block">Energy Level</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.characteristics.energyLevel || 'Moderate'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                        <Scissors className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted block">Grooming</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.characteristics.groomingNeeds?.split(' ')[0] || 'Moderate'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                        <Scale className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted block">Adult Weight</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.characteristics.typicalWeightRangeKg
                            ? `${result.characteristics.typicalWeightRangeKg.min}-${result.characteristics.typicalWeightRangeKg.max} kg`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border">
                        <Calendar className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                        <span className="text-[10px] text-muted block">Lifespan</span>
                        <span className="text-xs font-bold text-foreground">
                          {result.characteristics.lifeExpectancyYears
                            ? `${result.characteristics.lifeExpectancyYears.min}-${result.characteristics.lifeExpectancyYears.max} yrs`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Temperament */}
                {result.characteristics?.temperament && result.characteristics.temperament.length > 0 && (
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
                )}

                {/* Health Predispositions */}
                {result.healthConsiderations && result.healthConsiderations.length > 0 && (
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
                )}

                {/* Care Tips */}
                {result.careTips && result.careTips.length > 0 && (
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
                )}

                {/* Disclaimer */}
                <div className="p-3 bg-surface-2/60 border border-border rounded-xl text-[11px] text-muted flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                  <p className="leading-relaxed">
                    {result.disclaimer ||
                      'Breed prediction is estimated by visual model analysis. DNA genetic tests provide 100% definitive heritage.'}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="card p-12 border-border border-dashed text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="p-4 rounded-2xl bg-surface-2 mb-4 text-muted">
                <Camera className="h-8 w-8 text-purple-500/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">Upload a Photo to Begin</h3>
              <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
                Take or upload a photo of your dog or cat. The multimodal AI validates the subject and detects facial landmarks, coat patterns, and physical traits to estimate breed lineage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}