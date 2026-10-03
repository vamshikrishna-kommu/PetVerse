import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePet, useDeletePet, usePetTimeline, useUpdatePet, useUploadGallery, useRemoveGalleryImage, useSetPrimaryGalleryImage } from '../hooks/usePets';
import { useHealthDashboard } from '@/features/health/hooks/useHealth';
import { 
  ArrowLeft, Edit2, Trash2, PawPrint, Weight, Activity, 
  Syringe, Heart, Stethoscope, Cake, FileText, Share2, 
  Shield, ImagePlus, Search, Pill, AlertTriangle, Plus, X, ChevronLeft, ChevronRight, QrCode, CheckCircle2
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { calculateAge } from '@/shared/utils/date';
import { toast } from 'sonner';
import { Timeline } from '@/shared/components/ui/Timeline';
import { cn } from '@/shared/utils/cn';

export default function PetDetailPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { data: pet, isLoading, error } = usePet(petId as string);
  const { data: timeline, isLoading: isLoadingTimeline } = usePetTimeline(petId as string);
  const { data: healthData } = useHealthDashboard(petId as string);
  const deletePet = useDeletePet();
  const updatePet = useUpdatePet();
  const uploadGallery = useUploadGallery();
  const removeGalleryImage = useRemoveGalleryImage();
  const setPrimaryGalleryImage = useSetPrimaryGalleryImage();

  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'gallery'>('overview');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this pet? All medical records, vaccinations, and reminders will be deleted. This action cannot be undone.')) {
      deletePet.mutate(petId as string, {
        onSuccess: () => {
          toast.success('Pet deleted successfully');
          navigate('/pets');
        },
        onError: () => {
          toast.error('Failed to delete pet');
        }
      });
    }
  };

  const handleToggleLost = (newLostStatus: boolean) => {
    const confirmMsg = newLostStatus
      ? `Are you sure you want to report ${pet?.name} as lost? This will broadcast an alert across the community board and public safety profile.`
      : `Mark ${pet?.name} as found and safe? This will clear the active emergency alert.`;
    
    if (window.confirm(confirmMsg)) {
      updatePet.mutate(
        { id: petId as string, data: { isLost: newLostStatus } },
        {
          onSuccess: () => {
            toast.success(newLostStatus ? 'Emergency alert activated' : 'Pet marked as safe');
          },
          onError: () => {
            toast.error('Failed to update lost status');
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="container-page py-8 flex flex-col items-center justify-center min-h-[60vh]">
        <PawPrint className="h-16 w-16 text-muted mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">Pet Not Found</h2>
        <p className="text-muted mb-6">We couldn't find the pet you're looking for.</p>
        <button 
          onClick={() => navigate('/pets')}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Pets
        </button>
      </div>
    );
  }

  const age = pet.dob ? calculateAge(pet.dob) : pet.estimatedAge || 'Unknown age';
  const realHealthScore = healthData?.healthScore?.score ?? 85;

  return (
    <div className="container-page py-8 space-y-6">
      {/* Emergency Lost Banner */}
      {pet.isLost && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3 text-rose-600">
            <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
            <div>
              <h4 className="font-bold text-sm">ACTIVE LOST PET ALERT</h4>
              <p className="text-xs text-rose-600/80">
                {pet.name} is currently flagged as lost on the community board and public safety profile.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleLost(false)}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl"
          >
            <CheckCircle2 className="w-4 h-4" /> Mark as Safe & Found
          </button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/pets')}
          className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Pets
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {pet.isLost ? (
            <button
              onClick={() => handleToggleLost(false)}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-emerald-500/20 text-emerald-600"
            >
              <CheckCircle2 className="h-4 w-4" /> Found & Safe
            </button>
          ) : (
            <button
              onClick={() => handleToggleLost(true)}
              className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-rose-500/20 text-rose-600"
            >
              <AlertTriangle className="h-4 w-4" /> Report Lost
            </button>
          )}

          <Link
            to={`/pets/${pet._id}/qr`}
            className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/20 text-primary"
          >
            <QrCode className="h-4 w-4" /> QR Tag
          </Link>
          <button onClick={() => navigate(`/pets/${pet._id}/edit`)} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-2 text-foreground">
            <Edit2 className="h-4 w-4" /> Edit Profile
          </button>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-danger/20 text-danger"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Pet Profile Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card overflow-hidden sticky top-6">
            <div className="relative h-72 bg-gradient-to-br from-primary/20 to-accent/20">
              {pet.avatar ? (
                <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <PawPrint className="h-24 w-24 text-foreground" />
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                {pet.isVaccinated && (
                  <div className="flex items-center gap-1 rounded-full bg-success/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-sm">
                    <Shield className="h-3 w-3" /> Vaccinated
                  </div>
                )}
                {pet.isAdopted && (
                  <div className="flex items-center gap-1 rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white shadow-sm">
                    <Heart className="h-3 w-3" /> Adopted
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold text-foreground">{pet.name}</h1>
                <p className="text-lg font-medium text-primary mt-1">
                  {pet.breed ? `${pet.breed} ${pet.species}` : pet.species}
                </p>
                {pet.nickname && <p className="text-sm text-muted mt-1">"{pet.nickname}"</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-surface-2 p-4 text-center hover:border-primary/50 transition-colors">
                  <Cake className="h-5 w-5 text-accent mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Age</p>
                  <p className="font-semibold text-foreground truncate">{age}</p>
                </div>
                <div className="card bg-surface-2 p-4 text-center hover:border-primary/50 transition-colors">
                  <Weight className="h-5 w-5 text-secondary mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Weight</p>
                  <p className="font-semibold text-foreground truncate">{pet.weight ? `${pet.weight} kg` : 'N/A'}</p>
                </div>
                <div className="card bg-surface-2 p-4 text-center hover:border-primary/50 transition-colors">
                  <PawPrint className="h-5 w-5 text-primary mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Gender</p>
                  <p className="font-semibold text-foreground capitalize truncate">{pet.gender}</p>
                </div>
                <div className="card bg-surface-2 p-4 text-center hover:border-primary/50 transition-colors">
                  <Heart className="h-5 w-5 text-danger mx-auto mb-2 opacity-70" />
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Health Score</p>
                  <p className={cn("font-bold truncate text-lg", realHealthScore >= 80 ? "text-success" : realHealthScore >= 60 ? "text-warning" : "text-danger")}>
                    {realHealthScore}/100
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Color</span>
                  <span className="font-medium text-foreground">{pet.color || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Lifestyle</span>
                  <span className="font-medium text-foreground capitalize">{pet.lifestyle || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Activity</span>
                  <span className="font-medium text-foreground capitalize">{pet.activityLevel || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Microchip</span>
                  <span className="font-medium text-foreground font-mono">{pet.microchipId || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link to={`/pets/${pet._id}/health`} className="card-interactive p-4 text-center flex flex-col items-center justify-center gap-3 border-transparent hover:border-danger/30 hover:bg-danger/5">
              <div className="h-12 w-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                <Stethoscope className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Medical Records</span>
            </Link>
            
            <Link to={`/pets/${pet._id}/vaccinations`} className="card-interactive p-4 text-center flex flex-col items-center justify-center gap-3 border-transparent hover:border-success/30 hover:bg-success/5">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                <Syringe className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Vaccines</span>
            </Link>

            <Link to={`/pets/${pet._id}/medications`} className="card-interactive p-4 text-center flex flex-col items-center justify-center gap-3 border-transparent hover:border-indigo-500/30 hover:bg-indigo-500/5">
              <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Pill className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Medications</span>
            </Link>

            <Link to={`/pets/${pet._id}/growth`} className="card-interactive p-4 text-center flex flex-col items-center justify-center gap-3 border-transparent hover:border-primary/30 hover:bg-primary/5">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-foreground">Growth</span>
            </Link>
          </div>

          {/* Main Content Tabs */}
          <div className="card overflow-hidden">
            <div className="flex border-b border-border overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('overview')}
                className={cn("px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors", activeTab === 'overview' ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground")}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('timeline')}
                className={cn("px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors", activeTab === 'timeline' ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground")}
              >
                Timeline
              </button>
              <button 
                onClick={() => setActiveTab('gallery')}
                className={cn("px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors", activeTab === 'gallery' ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground")}
              >
                Gallery ({pet.gallery?.length || 0})
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* Detailed Health Section */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-danger" /> Health Profile
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="card bg-surface-2 p-4">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Allergies</p>
                        {pet.allergies && pet.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {pet.allergies.map((a) => <span key={a} className="badge bg-danger/10 text-danger border-danger/20">{a}</span>)}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground">None reported</p>
                        )}
                      </div>
                      <div className="card bg-surface-2 p-4">
                        <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Medications</p>
                        {pet.currentMedications && pet.currentMedications.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {pet.currentMedications.map((m) => <span key={m} className="badge bg-warning/10 text-warning border-warning/20">{m}</span>)}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground">None currently</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Additional details */}
                  {pet.behaviorNotes && (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted" /> Behavior & Notes
                      </h3>
                      <div className="card bg-surface-2 p-4 text-sm text-foreground leading-relaxed">
                        {pet.behaviorNotes}
                      </div>
                    </div>
                  )}

                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="animate-in fade-in slide-in-from-bottom-4">
                  {isLoadingTimeline ? (
                    <div className="flex justify-center py-12"><Skeleton className="h-64 w-full" /></div>
                  ) : (
                    <Timeline events={timeline || []} />
                  )}
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Pet Photo Gallery</h4>
                      <p className="text-xs text-muted">Cherished moments and identification photos</p>
                    </div>
                    <button
                      onClick={() => setIsAddingPhoto(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 shadow-sm transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Photo
                    </button>
                  </div>

                  {(!pet.gallery || pet.gallery.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 card border-dashed border-2 border-border">
                      <ImagePlus className="h-12 w-12 text-muted/40 mb-3" />
                      <p className="text-sm font-medium text-foreground">No photos in gallery yet</p>
                      <p className="text-xs text-muted mt-0.5 mb-4">Add your pet's favorite memories</p>
                      <button
                        onClick={() => setIsAddingPhoto(true)}
                        className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-sm"
                      >
                        Upload First Photo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {pet.gallery.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => setLightboxIndex(i)}
                          className="aspect-square rounded-xl overflow-hidden border border-border group relative cursor-pointer shadow-sm hover:shadow-md transition"
                        >
                          <img
                            src={img}
                            alt={`Gallery ${i}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2">
                            <Search className="h-5 w-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Photo Modal */}
                  {isAddingPhoto && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <h3 className="text-base font-bold text-foreground">Add Photo to Gallery</h3>
                          <button
                            onClick={() => {
                              setIsAddingPhoto(false);
                              setPhotoUrlInput('');
                            }}
                            className="text-muted hover:text-foreground p-1 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted uppercase mb-1.5">
                              Upload Photos from Device
                            </label>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                const files = e.target.files ? Array.from(e.target.files) : [];
                                if (files.length > 0) {
                                  uploadGallery.mutate(
                                    { id: pet._id, files },
                                    {
                                      onSuccess: () => {
                                        toast.success(`${files.length} photo(s) uploaded to gallery!`);
                                        setIsAddingPhoto(false);
                                      },
                                      onError: (err: any) =>
                                        toast.error(err?.response?.data?.error?.message || 'Failed to upload photos'),
                                    }
                                  );
                                }
                              }}
                              className="w-full text-xs text-muted file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer"
                            />
                            <p className="text-[10px] text-muted mt-1">
                              Select up to 10 images (JPEG, PNG, WebP — max 5 MB each)
                            </p>
                          </div>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink mx-3 text-muted text-[10px] uppercase font-semibold">Or enter image URL</span>
                            <div className="flex-grow border-t border-border"></div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-muted uppercase mb-1">
                              Image URL
                            </label>
                            <input
                              type="url"
                              placeholder="https://images.unsplash.com/..."
                              value={photoUrlInput}
                              onChange={(e) => setPhotoUrlInput(e.target.value)}
                              className="input w-full text-xs"
                            />
                          </div>
                        </div>

                        {photoUrlInput && (
                          <div className="aspect-video w-full rounded-xl overflow-hidden border border-border bg-surface-2">
                            <img
                              src={photoUrlInput}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={() => toast.error('Could not preview image. Please check the URL.')}
                            />
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() => {
                              setIsAddingPhoto(false);
                              setPhotoUrlInput('');
                            }}
                            className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-2 rounded-xl"
                          >
                            Cancel
                          </button>
                          <button
                            disabled={!photoUrlInput.trim() || updatePet.isPending}
                            onClick={() => {
                              const newGallery = [...(pet.gallery || []), photoUrlInput.trim()];
                              updatePet.mutate(
                                { id: pet._id, data: { gallery: newGallery } },
                                {
                                  onSuccess: () => {
                                    toast.success('Photo added to gallery!');
                                    setIsAddingPhoto(false);
                                    setPhotoUrlInput('');
                                  },
                                  onError: () => toast.error('Failed to add photo'),
                                }
                              );
                            }}
                            className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-sm disabled:opacity-60"
                          >
                            {updatePet.isPending ? 'Saving...' : 'Add URL to Gallery'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lightbox Modal */}
                  {lightboxIndex !== null && pet.gallery && pet.gallery[lightboxIndex] && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
                      <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
                        {/* Top bar */}
                        <div className="w-full flex items-center justify-between text-white pb-3">
                          <span className="text-xs font-medium opacity-80">
                            {lightboxIndex + 1} of {pet.gallery.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setPrimaryGalleryImage.mutate(
                                  { id: pet._id, imageUrl: pet.gallery![lightboxIndex] },
                                  {
                                    onSuccess: () => toast.success('Set as primary profile avatar!'),
                                    onError: () => toast.error('Failed to update primary avatar'),
                                  }
                                );
                              }}
                              disabled={setPrimaryGalleryImage.isPending}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 shadow-sm"
                            >
                              <PawPrint className="w-3.5 h-3.5" /> Make Avatar
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Delete this photo from gallery?')) {
                                  removeGalleryImage.mutate(
                                    { id: pet._id, imageUrl: pet.gallery![lightboxIndex] },
                                    {
                                      onSuccess: () => {
                                        toast.success('Photo removed');
                                        setLightboxIndex(null);
                                      },
                                      onError: () => toast.error('Failed to remove photo'),
                                    }
                                  );
                                }
                              }}
                              className="px-3 py-1.5 bg-danger/80 hover:bg-danger text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </button>
                            <button
                              onClick={() => setLightboxIndex(null)}
                              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Image */}
                        <div className="relative w-full max-h-[75vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/40">
                          <img
                            src={pet.gallery[lightboxIndex]}
                            alt="Lightbox view"
                            className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                          />

                          {lightboxIndex > 0 && (
                            <button
                              onClick={() => setLightboxIndex(lightboxIndex - 1)}
                              className="absolute left-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                          )}

                          {lightboxIndex < pet.gallery.length - 1 && (
                            <button
                              onClick={() => setLightboxIndex(lightboxIndex + 1)}
                              className="absolute right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}