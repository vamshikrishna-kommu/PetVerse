import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ImagePlus, User, Heart, Activity } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreatePet } from '../hooks/usePets';
import { toast } from 'sonner';
import { fireConfetti } from '@/shared/utils/confetti'; 
import { Dropzone } from '@/shared/components/ui/Dropzone';
import { ImageCropperModal } from '@/shared/components/ui/ImageCropperModal';
import { petsApi } from '../api/petsApi';
import { cn } from '@/shared/utils/cn';

// Extend the basic schema for frontend validation
const petFormSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other']),
  breed: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  weight: z.string().optional(),
  color: z.string().max(50).optional(),
  isVaccinated: z.boolean(),
  isSterilized: z.boolean(),
  lifestyle: z.enum(['indoor', 'outdoor', 'mixed']),
  activityLevel: z.enum(['low', 'moderate', 'high']),
  dob: z.string().optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

export default function AddPetPage() {
  const navigate = useNavigate();
  const createPet = useCreatePet();
  
  const [activeTab, setActiveTab] = useState<'basic' | 'health' | 'lifestyle'>('basic');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isValid },
    trigger
  } = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      species: 'dog',
      gender: 'unknown',
      isVaccinated: false,
      isSterilized: false,
      lifestyle: 'indoor',
      activityLevel: 'moderate',
    }
  });

  const onSubmit = async (data: PetFormValues) => {
    try {
      // 1. Create Pet Document
      const petDataToSubmit: any = { ...data };
      
      // Strip empty strings so they are treated as undefined by backend Zod
      Object.keys(petDataToSubmit).forEach((key) => {
        if (petDataToSubmit[key] === '') {
          delete petDataToSubmit[key];
        }
      });

      if (petDataToSubmit.weight !== undefined) {
        const parsed = parseFloat(petDataToSubmit.weight);
        if (!isNaN(parsed) && parsed > 0) {
          petDataToSubmit.weight = parsed;
        } else {
          delete petDataToSubmit.weight;
        }
      }
      
      const pet = await createPet.mutateAsync(petDataToSubmit);

      // 2. Upload Avatar if present
      if (croppedAvatar) {
        const file = new File([croppedAvatar], 'avatar.webp', { type: 'image/webp' });
        await petsApi.uploadAvatar(pet._id, file).catch(() => {
          toast.error('Pet created, but failed to upload avatar');
        });
      }

      fireConfetti();
      toast.success(`${pet.name} has been added to your family!`);
      setTimeout(() => navigate(`/pets/${pet._id}`), 2500);
    } catch (error: any) {
      if (error.isAxiosError && error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        details.forEach((err: any) => {
          setError(err.field as any, { type: 'server', message: err.message });
        });
        const basicFields = ['name', 'species', 'breed', 'gender', 'dob'];
        const healthFields = ['weight', 'color', 'isVaccinated', 'isSterilized'];
        if (details.some((d: any) => basicFields.includes(d.field))) {
          setActiveTab('basic');
        } else if (details.some((d: any) => healthFields.includes(d.field))) {
          setActiveTab('health');
        }
        const firstMsg = details[0]?.message;
        toast.error(firstMsg ? `Error: ${firstMsg}` : 'Please check the form for errors');
      } else {
        toast.error(error?.response?.data?.error?.message || 'Failed to add pet. Please try again.');
      }
    }
  };

  const handleNextTab = async (next: 'health' | 'lifestyle') => {
    const isBasicValid = await trigger(['name', 'species', 'breed']);
    if (isBasicValid) setActiveTab(next);
  };

  const handleFileAccepted = (file: File) => {
    setAvatarFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedAvatar(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  };

  return (
    <div className="container-narrow py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add New Pet</h1>
          <p className="text-sm text-muted">Create a detailed profile for your companion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left sidebar navigation */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('basic')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'basic' ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-2"
            )}
          >
            <User className="h-4 w-4" /> Basic Info
          </button>
          <button
            onClick={() => handleNextTab('health')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'health' ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-2"
            )}
          >
            <Heart className="h-4 w-4" /> Health & Medical
          </button>
          <button
            onClick={() => handleNextTab('lifestyle')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
              activeTab === 'lifestyle' ? "bg-primary text-white" : "bg-surface text-foreground hover:bg-surface-2"
            )}
          >
            <Activity className="h-4 w-4" /> Lifestyle
          </button>
        </div>

        {/* Form Container */}
        <div className="lg:col-span-9 card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            {/* BASIC INFO */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col items-center justify-center space-y-4 pb-4 border-b border-border">
                  <div className="relative">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="h-28 w-28 rounded-full object-cover border-4 border-surface" />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 border-2 border-dashed border-primary/30">
                        <ImagePlus className="h-10 w-10 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-sm">
                    <Dropzone onFileAccepted={handleFileAccepted} className="p-4" />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Pet Name <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('name')}
                      placeholder="e.g. Max, Bella"
                      className={cn("input", errors.name && "border-danger ring-danger/20 focus:ring-danger")}
                    />
                    {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Species <span className="text-danger">*</span></label>
                    <select {...register('species')} className="input">
                      <option value="dog">Dog 🐶</option>
                      <option value="cat">Cat 🐱</option>
                      <option value="bird">Bird 🦜</option>
                      <option value="rabbit">Rabbit 🐰</option>
                      <option value="reptile">Reptile 🦎</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Breed</label>
                    <input {...register('breed')} placeholder="e.g. Golden Retriever" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <select {...register('gender')} className="input">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <input type="date" {...register('dob')} className="input" />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => handleNextTab('health')}
                    className="rounded-xl bg-surface-2 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-3 transition-colors"
                  >
                    Continue to Health
                  </button>
                </div>
              </div>
            )}

            {/* HEALTH INFO */}
            {activeTab === 'health' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Health Details</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Weight (kg)</label>
                    <input type="number" step="0.1" {...register('weight')} placeholder="e.g. 15.5" className="input" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Color / Markings</label>
                    <input {...register('color')} placeholder="e.g. Golden, Black & White" className="input" />
                  </div>

                  <div className="space-y-4 sm:col-span-2 card bg-surface-2 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register('isVaccinated')} className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background" />
                      <div>
                        <p className="font-medium text-foreground">Up to date on Vaccinations</p>
                        <p className="text-xs text-muted">Check this if the pet has all basic vaccines.</p>
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4 sm:col-span-2 card bg-surface-2 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" {...register('isSterilized')} className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background" />
                      <div>
                        <p className="font-medium text-foreground">Spayed / Neutered</p>
                        <p className="text-xs text-muted">Check this if the pet has been sterilized.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button type="button" onClick={() => setActiveTab('basic')} className="text-sm font-medium text-muted hover:text-foreground">Back</button>
                  <button
                    type="button"
                    onClick={() => handleNextTab('lifestyle')}
                    className="rounded-xl bg-surface-2 px-6 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-3 transition-colors"
                  >
                    Continue to Lifestyle
                  </button>
                </div>
              </div>
            )}

            {/* LIFESTYLE INFO */}
            {activeTab === 'lifestyle' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Lifestyle Details</h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Primary Environment</label>
                    <select {...register('lifestyle')} className="input">
                      <option value="indoor">Strictly Indoor</option>
                      <option value="outdoor">Strictly Outdoor</option>
                      <option value="mixed">Indoor / Outdoor Mixed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Activity Level</label>
                    <select {...register('activityLevel')} className="input">
                      <option value="low">Low (Couch Potato)</option>
                      <option value="moderate">Moderate (Daily walks)</option>
                      <option value="high">High (Athletic / Working)</option>
                    </select>
                  </div>

                </div>

                <div className="flex items-center justify-between pt-8 border-t border-border">
                  <button type="button" onClick={() => setActiveTab('health')} className="text-sm font-medium text-muted hover:text-foreground">Back</button>
                  
                  <button
                    type="submit"
                    disabled={createPet.isPending || !isValid}
                    className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {createPet.isPending ? (
                      <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
                    ) : (
                      'Create Pet Profile'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      <ImageCropperModal
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false);
          setAvatarFile(null);
        }}
        imageFile={avatarFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}