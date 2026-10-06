import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ImagePlus,
  User,
  Heart,
  Activity,
  Save,
  X,
  Settings,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePet, useUpdatePet } from '../hooks/usePets';
import { petsApi } from '../api/petsApi';
import { toast } from 'sonner';
import { Dropzone } from '@/shared/components/ui/Dropzone';
import { ImageCropperModal } from '@/shared/components/ui/ImageCropperModal';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { cn } from '@/shared/utils/cn';

// ─── Validation Schema ─────────────────────────────────────────────────────
const editPetSchema = z.object({
  name: z.string().min(1, 'Pet name is required').max(50),
  nickname: z.string().max(50).optional(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other']),
  breed: z.string().max(100).optional(),
  subBreed: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'unknown']),
  dob: z.string().optional(),
  estimatedAge: z.string().optional(),
  color: z.string().max(50).optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  bloodGroup: z.string().max(20).optional(),

  microchipId: z.string().optional(),
  registrationNumber: z.string().optional(),
  passportNumber: z.string().optional(),

  allergies: z.string().optional(),
  chronicDiseases: z.string().optional(),
  disabilities: z.string().optional(),
  currentMedications: z.string().optional(),
  isVaccinated: z.boolean(),
  isSterilized: z.boolean(),

  lifestyle: z.enum(['indoor', 'outdoor', 'mixed']),
  activityLevel: z.enum(['low', 'moderate', 'high']),
  behaviorNotes: z.string().max(1000).optional(),

  shelterName: z.string().max(100).optional(),
  insuranceProvider: z.string().max(100).optional(),
  adoptionDate: z.string().optional(),
  insuranceExpiry: z.string().optional(),

  isPublicProfile: z.boolean(),
});

type EditPetFormValues = z.infer<typeof editPetSchema>;

function toDateInputValue(isoString?: string): string {
  if (!isoString) return '';
  try {
    return new Date(isoString).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function arrToStr(arr?: string[]): string {
  return (arr ?? []).join(', ');
}

function strToArr(str?: string): string[] {
  if (!str?.trim()) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

type Tab = 'basic' | 'health' | 'lifestyle' | 'advanced';

export default function EditPetPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { data: pet, isLoading, error } = usePet(petId as string);
  const updatePet = useUpdatePet();

  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [croppedAvatar, setCroppedAvatar] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<EditPetFormValues>({
    resolver: zodResolver(editPetSchema) as any,
    mode: 'onChange',
    defaultValues: {
      species: 'dog',
      gender: 'unknown',
      isVaccinated: false,
      isSterilized: false,
      lifestyle: 'indoor',
      activityLevel: 'moderate',
      isPublicProfile: true,
    },
  });

  useEffect(() => {
    if (!pet) return;
    reset({
      name: pet.name ?? '',
      nickname: pet.nickname ?? '',
      species: pet.species ?? 'dog',
      breed: pet.breed ?? '',
      subBreed: pet.subBreed ?? '',
      gender: pet.gender ?? 'unknown',
      dob: toDateInputValue(pet.dob),
      estimatedAge: pet.estimatedAge ?? '',
      color: pet.color ?? '',
      weight: pet.weight != null ? String(pet.weight) : '',
      height: pet.height != null ? String(pet.height) : '',
      bloodGroup: pet.bloodGroup ?? '',
      microchipId: pet.microchipId ?? '',
      registrationNumber: pet.registrationNumber ?? '',
      passportNumber: pet.passportNumber ?? '',
      allergies: arrToStr(pet.allergies),
      chronicDiseases: arrToStr(pet.chronicDiseases),
      disabilities: arrToStr(pet.disabilities),
      currentMedications: arrToStr(pet.currentMedications),
      isVaccinated: pet.isVaccinated ?? false,
      isSterilized: pet.isSterilized ?? false,
      lifestyle: pet.lifestyle ?? 'indoor',
      activityLevel: pet.activityLevel ?? 'moderate',
      behaviorNotes: pet.behaviorNotes ?? '',
      shelterName: pet.shelterName ?? '',
      insuranceProvider: pet.insuranceProvider ?? '',
      adoptionDate: toDateInputValue(pet.adoptionDate),
      insuranceExpiry: toDateInputValue(pet.insuranceExpiry),
      isPublicProfile: pet.isPublicProfile ?? true,
    });
    if (pet.avatar) setAvatarPreview(pet.avatar);
  }, [pet, reset]);

  const onSubmit = async (data: EditPetFormValues) => {
    try {
      const payload: Record<string, unknown> = {};

      Object.entries(data).forEach(([key, val]) => {
        if (val === '' || val === undefined) return;
        payload[key] = val;
      });

      // Numeric conversions
      if (payload.weight !== undefined) {
        const parsed = parseFloat(payload.weight as string);
        if (!isNaN(parsed) && parsed > 0) {
          payload.weight = parsed;
        } else {
          delete payload.weight;
        }
      }
      if (payload.height !== undefined) {
        const parsed = parseFloat(payload.height as string);
        if (!isNaN(parsed) && parsed > 0) {
          payload.height = parsed;
        } else {
          delete payload.height;
        }
      }

      // Array conversions
      payload.allergies = strToArr(data.allergies);
      payload.chronicDiseases = strToArr(data.chronicDiseases);
      payload.disabilities = strToArr(data.disabilities);
      payload.currentMedications = strToArr(data.currentMedications);

      // Remove blank date strings
      if (!data.dob) delete payload.dob;
      if (!data.adoptionDate) delete payload.adoptionDate;
      if (!data.insuranceExpiry) delete payload.insuranceExpiry;

      await updatePet.mutateAsync({ id: petId as string, data: payload as any });

      if (croppedAvatar) {
        setIsUploadingAvatar(true);
        const file = new File([croppedAvatar], 'avatar.webp', { type: 'image/webp' });
        await petsApi.uploadAvatar(petId as string, file).catch(() => {
          toast.error('Pet updated, but failed to upload new avatar.');
        });
        setIsUploadingAvatar(false);
      }

      toast.success(`${data.name}'s profile has been updated!`);
      navigate(`/pets/${petId}`);
    } catch (err: any) {
      setIsUploadingAvatar(false);
      if (err.isAxiosError && err.response?.data?.error?.details) {
        const details = err.response.data.error.details;
        details.forEach((e: any) => {
          setError(e.field as any, { type: 'server', message: e.message });
        });
        const basicFields = ['name', 'nickname', 'species', 'breed', 'subBreed', 'gender', 'dob', 'estimatedAge', 'color'];
        const healthFields = ['weight', 'height', 'bloodGroup', 'allergies', 'chronicDiseases', 'disabilities', 'currentMedications', 'isVaccinated', 'isSterilized'];
        const lifestyleFields = ['lifestyle', 'activityLevel', 'behaviorNotes'];
        if (details.some((d: any) => basicFields.includes(d.field))) {
          setActiveTab('basic');
        } else if (details.some((d: any) => healthFields.includes(d.field))) {
          setActiveTab('health');
        } else if (details.some((d: any) => lifestyleFields.includes(d.field))) {
          setActiveTab('lifestyle');
        } else {
          setActiveTab('advanced');
        }
        const firstMsg = details[0]?.message;
        toast.error(firstMsg ? `Error: ${firstMsg}` : 'Please check the form for errors.');
      } else {
        const message =
          err.response?.data?.error?.message ??
          err.message ??
          'Failed to update pet. Please try again.';
        toast.error(message);
      }
    }
  };

  const handleFileAccepted = (file: File) => {
    setAvatarFile(file);
    setShowCropper(true);
  };

  const handleCropComplete = (blob: Blob) => {
    setCroppedAvatar(blob);
    setAvatarPreview(URL.createObjectURL(blob));
  };

  const isSaving = updatePet.isPending || isUploadingAvatar;

  if (isLoading) {
    return (
      <div className="container-narrow py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
          <div className="lg:col-span-9">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="container-narrow py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-foreground">Pet Not Found</h2>
        <p className="text-muted mb-6">We couldn't find the pet you're trying to edit.</p>
        <button
          onClick={() => navigate('/pets')}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Pets
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; Icon: any }[] = [
    { key: 'basic', label: 'Basic Info', Icon: User },
    { key: 'health', label: 'Health & Medical', Icon: Heart },
    { key: 'lifestyle', label: 'Lifestyle', Icon: Activity },
    { key: 'advanced', label: 'Identity & Ownership', Icon: Settings },
  ];

  return (
    <div className="container-narrow py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(`/pets/${petId}`)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-foreground transition-colors hover:bg-surface-3"
          aria-label="Back to pet profile"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit {pet.name}</h1>
          <p className="text-sm text-muted">Update {pet.name}'s profile information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                activeTab === key
                  ? 'bg-primary text-white'
                  : 'bg-surface text-foreground hover:bg-surface-2'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="lg:col-span-9 card p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} id="edit-pet-form" className="space-y-8">

            {/* BASIC INFO */}
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Basic Information</h3>

                {/* Avatar */}
                <div className="flex flex-col items-center justify-center space-y-4 pb-4 border-b border-border">
                  <div className="relative">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar Preview"
                        className="h-28 w-28 rounded-full object-cover border-4 border-surface"
                      />
                    ) : (
                      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 border-2 border-dashed border-primary/30">
                        <ImagePlus className="h-10 w-10 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-sm">
                    <Dropzone onFileAccepted={handleFileAccepted} className="p-4" />
                  </div>
                  {pet.avatar && !croppedAvatar && (
                    <p className="text-xs text-muted">Current photo shown. Upload a new photo to replace it.</p>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Pet Name <span className="text-danger">*</span>
                    </label>
                    <input
                      {...register('name')}
                      id="edit-pet-name"
                      placeholder="e.g. Max, Bella"
                      className={cn('input', errors.name && 'border-danger ring-danger/20')}
                    />
                    {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Nickname</label>
                    <input {...register('nickname')} placeholder="e.g. Buddy, Fluffball" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Species <span className="text-danger">*</span></label>
                    <select {...register('species')} id="edit-pet-species" className="input">
                      <option value="dog">Dog 🐶</option>
                      <option value="cat">Cat 🐱</option>
                      <option value="bird">Bird 🦜</option>
                      <option value="rabbit">Rabbit 🐰</option>
                      <option value="fish">Fish 🐟</option>
                      <option value="reptile">Reptile 🦎</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Breed</label>
                    <input {...register('breed')} id="edit-pet-breed" placeholder="e.g. Golden Retriever" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Sub-breed</label>
                    <input {...register('subBreed')} placeholder="e.g. Miniature" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Gender</label>
                    <select {...register('gender')} id="edit-pet-gender" className="input">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <input
                      type="date"
                      id="edit-pet-dob"
                      {...register('dob')}
                      className="input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Estimated Age</label>
                    <input {...register('estimatedAge')} placeholder="e.g. 2 years" className="input" />
                    <p className="text-xs text-muted">Used when date of birth is unknown.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Color / Markings</label>
                    <input
                      {...register('color')}
                      id="edit-pet-color"
                      placeholder="e.g. Golden, Black & White"
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* HEALTH */}
            {activeTab === 'health' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Health & Medical</h3>
                <div className="grid gap-6 sm:grid-cols-2">

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      id="edit-pet-weight"
                      {...register('weight')}
                      placeholder="e.g. 15.5"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Height (cm)</label>
                    <input type="number" step="0.1" min="0" {...register('height')} placeholder="e.g. 60" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Blood Group</label>
                    <input {...register('bloodGroup')} placeholder="e.g. DEA 1.1+" className="input" />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Known Allergies</label>
                    <input
                      {...register('allergies')}
                      id="edit-pet-allergies"
                      placeholder="e.g. Peanuts, Pollen (comma-separated)"
                      className="input"
                    />
                    <p className="text-xs text-muted">Separate multiple entries with a comma.</p>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Chronic Conditions</label>
                    <input
                      {...register('chronicDiseases')}
                      placeholder="e.g. Hip Dysplasia, Diabetes (comma-separated)"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Disabilities</label>
                    <input
                      {...register('disabilities')}
                      placeholder="e.g. Blind in left eye (comma-separated)"
                      className="input"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Current Medications</label>
                    <input
                      {...register('currentMedications')}
                      placeholder="e.g. Metformin, Thyrovet (comma-separated)"
                      className="input"
                    />
                  </div>

                  <div className="sm:col-span-2 card bg-surface-2 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isVaccinated')}
                        id="edit-pet-vaccinated"
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background"
                      />
                      <div>
                        <p className="font-medium text-foreground">Up to date on Vaccinations</p>
                        <p className="text-xs text-muted">Check this if the pet has all basic vaccines.</p>
                      </div>
                    </label>
                  </div>

                  <div className="sm:col-span-2 card bg-surface-2 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isSterilized')}
                        id="edit-pet-sterilized"
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background"
                      />
                      <div>
                        <p className="font-medium text-foreground">Spayed / Neutered</p>
                        <p className="text-xs text-muted">Check this if the pet has been sterilized.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* LIFESTYLE */}
            {activeTab === 'lifestyle' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Lifestyle</h3>
                <div className="grid gap-6 sm:grid-cols-2">

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Primary Environment</label>
                    <select {...register('lifestyle')} id="edit-pet-lifestyle" className="input">
                      <option value="indoor">Strictly Indoor</option>
                      <option value="outdoor">Strictly Outdoor</option>
                      <option value="mixed">Indoor / Outdoor Mixed</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Activity Level</label>
                    <select {...register('activityLevel')} id="edit-pet-activity" className="input">
                      <option value="low">Low (Couch Potato)</option>
                      <option value="moderate">Moderate (Daily walks)</option>
                      <option value="high">High (Athletic / Working)</option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-foreground">Behavior Notes</label>
                    <textarea
                      {...register('behaviorNotes')}
                      id="edit-pet-notes"
                      rows={4}
                      placeholder="Describe the pet's temperament, habits, training status, etc."
                      className="input resize-none"
                    />
                    {errors.behaviorNotes && (
                      <p className="text-xs text-danger">{errors.behaviorNotes.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ADVANCED */}
            {activeTab === 'advanced' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold border-b border-border pb-2">Identity & Ownership</h3>
                <div className="grid gap-6 sm:grid-cols-2">

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Microchip ID</label>
                    <input
                      {...register('microchipId')}
                      id="edit-pet-microchip"
                      placeholder="e.g. 985112345678901"
                      className="input font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Registration Number</label>
                    <input {...register('registrationNumber')} placeholder="Kennel club / shelter reg no." className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Passport Number</label>
                    <input {...register('passportNumber')} placeholder="International pet passport" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Shelter / Breeder Name</label>
                    <input {...register('shelterName')} placeholder="Where the pet came from" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Adoption / Purchase Date</label>
                    <input
                      type="date"
                      {...register('adoptionDate')}
                      className="input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Insurance Provider</label>
                    <input {...register('insuranceProvider')} placeholder="e.g. Petplan, Nationwide" className="input" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Insurance Expiry Date</label>
                    <input type="date" {...register('insuranceExpiry')} className="input" />
                  </div>

                  <div className="sm:col-span-2 card bg-surface-2 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('isPublicProfile')}
                        id="edit-pet-public"
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary bg-background"
                      />
                      <div>
                        <p className="font-medium text-foreground">Public Safety Profile (QR scan)</p>
                        <p className="text-xs text-muted">
                          Allow the public to view basic contact info via the QR tag. Recommended for lost-pet recovery.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => navigate(`/pets/${petId}`)}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>

              <button
                type="submit"
                id="edit-pet-save"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-primary px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
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
