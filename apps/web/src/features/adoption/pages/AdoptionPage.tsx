import React, { useState } from 'react';
import {
  Heart,
  Search,
  Filter,
  PawPrint,
  MapPin,
  ShieldCheck,
  Plus,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  useAdoptionListings,
  useMyAdoptionApplications,
  useCreateListing,
  useSubmitApplication,
} from '../hooks/useAdoption';
import { useAuthStore } from '@/app/store/auth.store';
import type { IAdoptionListing, PetSpecies, PetGender } from '@petverse/shared-types';
import { toast } from 'sonner';

export default function AdoptionPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'listings' | 'applications'>('listings');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedListingForApply, setSelectedListingForApply] = useState<IAdoptionListing | null>(null);

  // Queries
  const { data: listingsData, isLoading: listingsLoading } = useAdoptionListings({
    species: selectedSpecies !== 'all' ? selectedSpecies : undefined,
    gender: selectedGender !== 'all' ? selectedGender : undefined,
    search: searchQuery.trim() || undefined,
  });

  const { data: myApps, isLoading: appsLoading } = useMyAdoptionApplications();

  const createListingMutation = useCreateListing();
  const submitAppMutation = useSubmitApplication();

  // Create Listing Form state
  const [createForm, setCreateForm] = useState({
    name: '',
    species: 'dog' as PetSpecies,
    breed: '',
    age: '',
    gender: 'male' as PetGender,
    size: 'medium' as 'small' | 'medium' | 'large' | 'giant',
    description: '',
    location: '',
    photoUrl: '',
    isVaccinated: true,
    isSpayedNeutered: true,
    specialNeeds: '',
    shelterName: '',
  });

  // Application Form state
  const [appForm, setAppForm] = useState({
    applicantName: user ? `${user.profile.firstName} ${user.profile.lastName}` : '',
    applicantEmail: user?.email || '',
    applicantPhone: user?.phone || '',
    homeType: 'apartment' as 'apartment' | 'house_with_yard' | 'house_no_yard',
    hasOtherPets: false,
    otherPetsDetails: '',
    experienceDescription: '',
  });

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.age.trim() || !createForm.location.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      await createListingMutation.mutateAsync({
        name: createForm.name.trim(),
        species: createForm.species,
        breed: createForm.breed.trim() || undefined,
        age: createForm.age.trim(),
        gender: createForm.gender,
        size: createForm.size,
        description: createForm.description.trim(),
        location: createForm.location.trim(),
        photos: createForm.photoUrl ? [createForm.photoUrl.trim()] : [],
        isVaccinated: createForm.isVaccinated,
        isSpayedNeutered: createForm.isSpayedNeutered,
        specialNeeds: createForm.specialNeeds.trim() || undefined,
        shelterName: createForm.shelterName.trim() || undefined,
      });
      toast.success('Adoption listing published successfully!');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        species: 'dog',
        breed: '',
        age: '',
        gender: 'male',
        size: 'medium',
        description: '',
        location: '',
        photoUrl: '',
        isVaccinated: true,
        isSpayedNeutered: true,
        specialNeeds: '',
        shelterName: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForApply) return;
    if (!user) {
      toast.error('Please log in to submit an adoption application');
      return;
    }

    try {
      await submitAppMutation.mutateAsync({
        listingId: selectedListingForApply._id,
        data: appForm,
      });
      toast.success(`Application for ${selectedListingForApply.name} submitted!`);
      setSelectedListingForApply(null);
      setActiveTab('applications');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    }
  };

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500/20" /> Pet Adoption & Fosters
          </h1>
          <p className="text-muted text-sm mt-1">
            Give a rescued companion a second chance. Verified rescues, vaccinated shelter pets, and gentle companions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-2 p-1 rounded-xl border border-border text-xs">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'listings'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Browse Rescues
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'applications'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              My Applications ({myApps?.length || 0})
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary text-xs flex items-center gap-2 shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Post Rescue
          </button>
        </div>
      </div>

      {/* TAB 1: LISTINGS */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['all', 'dog', 'cat', 'rabbit', 'bird'].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSpecies(sp)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition capitalize ${
                    selectedSpecies === sp
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground'
                  }`}
                >
                  {sp === 'all' ? 'All Companions' : `${sp}s`}
                </button>
              ))}

              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="input py-1.5 px-3 text-xs capitalize"
              >
                <option value="all">Any Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search breed, name, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-9 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listingsData?.listings?.map((pet) => (
              <div
                key={pet._id}
                className="card overflow-hidden border-border hover:border-primary/40 transition flex flex-col justify-between shadow-sm group"
              >
                <div>
                  <div className="relative h-56 bg-surface-3 overflow-hidden">
                    <img
                      src={pet.photos?.[0] || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80'}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 badge bg-black/60 text-white backdrop-blur-sm border-0 text-[10px] font-bold capitalize">
                      {pet.species} • {pet.gender}
                    </span>
                    <span
                      className={`absolute top-2.5 right-2.5 badge text-[10px] font-bold uppercase tracking-wider ${
                        pet.status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {pet.status}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition">
                        {pet.name}
                      </h3>
                      <span className="text-xs font-semibold text-muted bg-surface-2 px-2 py-0.5 rounded-md">
                        {pet.age}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <PawPrint className="w-3.5 h-3.5 text-primary" />
                      <span>{pet.breed || 'Mixed Breed'}</span>
                      <span>•</span>
                      <span className="capitalize">{pet.size} size</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{pet.location}</span>
                    </div>

                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                      {pet.description}
                    </p>

                    {/* Vetting highlights */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {pet.isVaccinated && (
                        <span className="badge bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Fully Vaccinated
                        </span>
                      )}
                      {pet.isSpayedNeutered && (
                        <span className="badge bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Spayed / Neutered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-border mt-3 space-y-3">
                  <div className="text-[11px] text-muted flex items-center justify-between">
                    <span className="font-semibold text-foreground truncate max-w-[180px]">
                      {pet.shelterName}
                    </span>
                    <span>{pet.shelterContact}</span>
                  </div>

                  <button
                    onClick={() => setSelectedListingForApply(pet)}
                    disabled={pet.status !== 'available'}
                    className="btn btn-primary w-full text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Heart className="w-3.5 h-3.5" /> Apply for Adoption
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {(!listingsData?.listings || listingsData.listings.length === 0) && !listingsLoading && (
            <div className="card p-12 text-center border-border space-y-3">
              <PawPrint className="w-12 h-12 text-muted mx-auto opacity-40" />
              <h3 className="text-base font-bold text-foreground">No Adoption Listings Found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                No rescue companions match your search filter right now. Try expanding your search radius or selecting all species.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {myApps?.map((app) => (
            <div key={app._id} className="card p-6 border-border space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      Application for {app.listing?.name || 'Rescue Pet'}
                    </h3>
                    <span
                      className={`badge text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : app.status === 'under_review'
                          ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                          : app.status === 'rejected'
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    Submitted on {new Date(app.createdAt).toLocaleDateString()} • {app.listing?.location}
                  </span>
                </div>

                {app.listing?.shelterContact && (
                  <div className="text-xs text-muted">
                    <span>Shelter Contact: </span>
                    <span className="font-semibold text-foreground">{app.listing.shelterContact}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-foreground/80 space-y-1.5">
                <div>
                  <span className="font-semibold text-muted">Housing Setup: </span>
                  <span className="capitalize">{app.homeType.replace(/_/g, ' ')}</span>
                  {app.hasOtherPets && <span className="ml-2">({app.otherPetsDetails || 'Has other pets'})</span>}
                </div>
                <div>
                  <span className="font-semibold text-muted">Applicant Statement: </span>
                  <span>{app.experienceDescription}</span>
                </div>
                {app.reviewNotes && (
                  <div className="p-3 bg-surface-2 rounded-xl border border-border mt-2">
                    <span className="font-bold text-primary block mb-0.5">Shelter Review Feedback:</span>
                    <span>{app.reviewNotes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {(!myApps || myApps.length === 0) && !appsLoading && (
            <div className="card p-12 text-center border-border space-y-3">
              <FileText className="w-12 h-12 text-muted mx-auto opacity-40" />
              <h3 className="text-base font-bold text-foreground">No Adoption Applications</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                You haven't submitted any adoption applications yet. Browse available rescue pets to begin your adoption journey.
              </p>
              <button
                onClick={() => setActiveTab('listings')}
                className="btn btn-primary text-xs inline-flex items-center gap-2 mt-2"
              >
                Browse Available Pets
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADOPTION APPLICATION MODAL */}
      {selectedListingForApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-lg w-full p-6 border-border space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" /> Apply to Adopt {selectedListingForApply.name}
                </h3>
                <p className="text-xs text-muted">
                  {selectedListingForApply.species} • {selectedListingForApply.breed || 'Rescue'} ({selectedListingForApply.location})
                </p>
              </div>
              <button
                onClick={() => setSelectedListingForApply(null)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Full Name *</label>
                <input
                  type="text"
                  value={appForm.applicantName}
                  onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Email *</label>
                  <input
                    type="email"
                    value={appForm.applicantEmail}
                    onChange={(e) => setAppForm({ ...appForm, applicantEmail: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={appForm.applicantPhone}
                    onChange={(e) => setAppForm({ ...appForm, applicantPhone: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Dwelling / Housing Type *</label>
                <select
                  value={appForm.homeType}
                  onChange={(e) => setAppForm({ ...appForm, homeType: e.target.value as any })}
                  className="input w-full capitalize"
                >
                  <option value="apartment">Apartment / Condominium</option>
                  <option value="house_with_yard">Single Family House (Fenced Yard)</option>
                  <option value="house_no_yard">Single Family House (No Fenced Yard)</option>
                </select>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appForm.hasOtherPets}
                    onChange={(e) => setAppForm({ ...appForm, hasOtherPets: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="font-semibold text-foreground">Do you currently have other pets at home?</span>
                </label>

                {appForm.hasOtherPets && (
                  <input
                    type="text"
                    placeholder="List existing pets (species, age, vaccinated status)..."
                    value={appForm.otherPetsDetails}
                    onChange={(e) => setAppForm({ ...appForm, otherPetsDetails: e.target.value })}
                    className="input w-full text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Why are you interested in adopting {selectedListingForApply.name}? *
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell the foster caregiver about your daily routine, experience with pets, and home environment..."
                  value={appForm.experienceDescription}
                  onChange={(e) => setAppForm({ ...appForm, experienceDescription: e.target.value })}
                  className="input w-full resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedListingForApply(null)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitAppMutation.isPending}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  {submitAppMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE RESCUE LISTING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-xl w-full p-6 border-border space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Post Companion for Adoption
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Pet Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Toby"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Species *</label>
                  <select
                    value={createForm.species}
                    onChange={(e) => setCreateForm({ ...createForm, species: e.target.value as any })}
                    className="input w-full capitalize"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Breed</label>
                  <input
                    type="text"
                    placeholder="e.g. Border Collie"
                    value={createForm.breed}
                    onChange={(e) => setCreateForm({ ...createForm, breed: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Age *</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 years"
                    value={createForm.age}
                    onChange={(e) => setCreateForm({ ...createForm, age: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Gender *</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value as any })}
                    className="input w-full capitalize"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Size *</label>
                  <select
                    value={createForm.size}
                    onChange={(e) => setCreateForm({ ...createForm, size: e.target.value as any })}
                    className="input w-full capitalize"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="giant">Giant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-foreground mb-1">Location / City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Austin, TX"
                    value={createForm.location}
                    onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Photo Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={createForm.photoUrl}
                  onChange={(e) => setCreateForm({ ...createForm, photoUrl: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Rescue Story & Personality *</label>
                <textarea
                  rows={3}
                  placeholder="Describe temperament, history, energy level, and compatibility with kids/other animals..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="input w-full resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isVaccinated}
                    onChange={(e) => setCreateForm({ ...createForm, isVaccinated: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="font-semibold text-foreground">Up-to-date on Vaccines</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isSpayedNeutered}
                    onChange={(e) => setCreateForm({ ...createForm, isSpayedNeutered: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="font-semibold text-foreground">Spayed / Neutered</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createListingMutation.isPending}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {createListingMutation.isPending ? 'Publishing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
