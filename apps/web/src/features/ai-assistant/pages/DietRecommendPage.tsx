import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePets } from '@/features/pets/hooks/usePets';
import { aiApi, type DietRecommendationResponse } from '@/services/api/aiApi';
import {
  Utensils,
  Sparkles,
  ArrowLeft,
  Flame,
  Droplets,
  Clock,
  ShieldCheck,
  Ban,
  Apple,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function DietRecommendPage() {
  const { data: petsData } = usePets();
  const petList = petsData?.data || [];

  const [selectedPetId, setSelectedPetId] = useState<string>('');
  const [species, setSpecies] = useState<'dog' | 'cat'>('dog');
  const [breed, setBreed] = useState<string>('Golden Retriever');
  const [ageMonths, setAgeMonths] = useState<number>(24);
  const [weightKg, setWeightKg] = useState<number>(28);
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [dietaryGoal, setDietaryGoal] = useState<'maintenance' | 'weight_loss' | 'weight_gain' | 'growth'>('maintenance');
  const [allergiesText, setAllergiesText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DietRecommendationResponse | null>(null);

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
    if (!petId) return;
    const pet = petList.find((p) => p._id === petId);
    if (pet) {
      if (pet.species === 'dog' || pet.species === 'cat') {
        setSpecies(pet.species);
      }
      if (pet.breed) setBreed(pet.breed);
      if (pet.weight) setWeightKg(pet.weight);
      if (pet.dob) {
        const diff = Math.max(
          1,
          Math.floor((Date.now() - new Date(pet.dob).getTime()) / (1000 * 60 * 60 * 24 * 30))
        );
        setAgeMonths(diff);
      }
    }
  };

  const handleCalculate = async () => {
    if (weightKg <= 0 || ageMonths <= 0) {
      toast.error('Please enter valid weight and age values.');
      return;
    }

    setIsLoading(true);
    try {
      const allergies = allergiesText
        ? allergiesText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

      const data = await aiApi.calculateDiet({
        species,
        breed,
        ageMonths,
        weightKg,
        activityLevel,
        dietaryGoal,
        allergies,
      });
      setResult(data);
    } catch {
      toast.error('Failed to calculate nutrition plan. Please try again.');
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
            <Utensils className="h-6 w-6 text-emerald-500" />
            Precision Veterinary Nutrition & Calorie Planner
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Calculate accurate daily calorie needs, feeding schedules, and macronutrient targets based on bio-metrics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 border-border">
            <h2 className="text-sm font-bold text-foreground mb-4">Pet Profile</h2>

            {petList.length > 0 && (
              <div className="mb-4">
                <label className="label text-xs">Load from My Pets</label>
                <select
                  value={selectedPetId}
                  onChange={(e) => handlePetSelect(e.target.value)}
                  className="input text-xs"
                >
                  <option value="">-- Manual Calculation --</option>
                  {petList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.species} • {p.weight ? `${p.weight}kg` : 'Weight unrecorded'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label text-xs">Species</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value as any)}
                  className="input text-xs"
                >
                  <option value="dog">Dog (Canine)</option>
                  <option value="cat">Cat (Feline)</option>
                </select>
              </div>

              <div>
                <label className="label text-xs">Breed</label>
                <input
                  type="text"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label text-xs">Current Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="120"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="input text-xs"
                />
              </div>

              <div>
                <label className="label text-xs">Age (Months)</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  value={ageMonths}
                  onChange={(e) => setAgeMonths(Number(e.target.value))}
                  className="input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="label text-xs">Activity Level</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value as any)}
                  className="input text-xs"
                >
                  <option value="low">Low (Senior / Couch)</option>
                  <option value="moderate">Moderate (Daily walks)</option>
                  <option value="high">High (Active / Working)</option>
                </select>
              </div>

              <div>
                <label className="label text-xs">Weight Goal</label>
                <select
                  value={dietaryGoal}
                  onChange={(e) => setDietaryGoal(e.target.value as any)}
                  className="input text-xs"
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="weight_loss">Healthy Weight Loss</option>
                  <option value="weight_gain">Healthy Weight Gain</option>
                  <option value="growth">Puppy / Kitten Growth</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label text-xs">Known Allergies / Intolerances (Optional)</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Chicken, Corn, Dairy (comma separated)"
                className="input text-xs"
              />
            </div>

            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="btn-primary w-full mt-6 py-3 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-spin" />
                  Calculating Formulation...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Nutrition Plan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7">
          {result ? (
            <div className="space-y-6 animate-fade-in">
              {/* Main Calories Card */}
              <div className="card p-6 border-border bg-gradient-to-br from-emerald-500/10 via-surface-1 to-surface-2 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Target Energy Expenditure
                    </span>
                    <h2 className="text-3xl font-extrabold text-foreground mt-0.5">
                      {result.targetDailyCaloriesKcal} <span className="text-lg font-normal text-muted">kcal / day</span>
                    </h2>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-500">
                    <Flame className="h-7 w-7" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border text-center">
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border">
                    <span className="text-[10px] text-muted block">Meals Per Day</span>
                    <span className="text-sm font-bold text-foreground">{result.mealsPerDay} meals</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border">
                    <span className="text-[10px] text-muted block">Per Meal</span>
                    <span className="text-sm font-bold text-foreground">{result.caloriesPerMealKcal} kcal</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-2/60 border border-border">
                    <span className="text-[10px] text-muted block">Daily Kibble Weight</span>
                    <span className="text-sm font-bold text-foreground">~{result.approximateDailyFoodGrams} g</span>
                  </div>
                </div>
              </div>

              {/* Macronutrients & Hydration */}
              <div className="card p-5 border-border">
                <h3 className="text-xs font-bold text-foreground mb-4">Target Macronutrient Balance</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">Crude Protein</span>
                      <span className="font-bold text-primary">{result.macronutrientTargets.proteinPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${result.macronutrientTargets.proteinPercent * 1.5}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">Crude Fat</span>
                      <span className="font-bold text-amber-500">{result.macronutrientTargets.fatPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${result.macronutrientTargets.fatPercent * 2}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-foreground">Dietary Fiber</span>
                      <span className="font-bold text-emerald-500">{result.macronutrientTargets.fiberPercent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${result.macronutrientTargets.fiberPercent * 8}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                    <Droplets className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-muted block">Daily Hydration Target</span>
                    <span className="text-xs font-bold text-foreground">
                      Minimum {result.hydrationGuidelineMl} ml clean water daily
                    </span>
                  </div>
                </div>
              </div>

              {/* Feeding Advice */}
              <div className="card p-5 border-border">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Veterinary Feeding Routine
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  {result.feedingScheduleAdvice}
                </p>
              </div>

              {/* Safe Treats & Toxic Foods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-4 border-border">
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <Apple className="h-3.5 w-3.5" /> Safe Low-Calorie Treats
                  </h4>
                  <ul className="space-y-1 text-xs text-muted">
                    {result.safeTreats.map((treat, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-foreground/80">
                        <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                        {treat}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card p-4 border-border bg-danger/5 border-danger/20">
                  <h4 className="text-xs font-bold text-danger mb-2 flex items-center gap-1.5">
                    <Ban className="h-3.5 w-3.5" /> Toxic Ingredients to Avoid
                  </h4>
                  <ul className="space-y-1 text-xs text-muted">
                    {result.toxicFoodsToAvoid.map((food, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-foreground/80">
                        <span className="h-1 w-1 rounded-full bg-danger shrink-0" />
                        {food}
                      </li>
                    ))}
                  </ul>
                </div>
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
                <Utensils className="h-8 w-8 text-emerald-500/60" />
              </div>
              <h3 className="text-base font-bold text-foreground">Configure Your Pet's Parameters</h3>
              <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
                Provide your pet's current weight, activity level, and goals to calculate their daily caloric target, portion sizes, and toxic food warnings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}