import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  MapPin,
  Phone,
  QrCode,
  ShieldAlert,
  CheckCircle2,
  Share2,
  HeartHandshake,
  Plus,
  X,
  Send,
  Sparkles,
  HelpCircle,
  Eye,
  MessageSquare,
} from 'lucide-react';
import {
  useLostFoundReports,
  useCreateLostFoundReport,
  useLostFoundMatches,
  useSendLostFoundInquiry,
  useResolveLostFoundReport,
} from '../hooks/useLostFound';
import { usePets } from '../../pets/hooks/usePets';
import { useAuthStore } from '@/app/store/auth.store';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';
import type { ILostFoundReport } from '../api/lostFoundApi';

export default function LostFoundPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  
  // Modals state
  const [reportModalType, setReportModalType] = useState<'lost' | 'found' | null>(null);
  const [matchingReportId, setMatchingReportId] = useState<string | null>(null);
  const [contactReport, setContactReport] = useState<ILostFoundReport | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryContactInfo, setInquiryContactInfo] = useState('');

  // Report Form State
  const [selectedPetId, setSelectedPetId] = useState('');
  const [formPetName, setFormPetName] = useState('');
  const [formSpecies, setFormSpecies] = useState<'dog' | 'cat' | 'bird' | 'rabbit' | 'other'>('dog');
  const [formBreed, setFormBreed] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formGender, setFormGender] = useState<'male' | 'female' | 'unknown'>('unknown');
  const [formAddress, setFormAddress] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  // Queries & Mutations
  const { data: reportsData, isLoading, refetch } = useLostFoundReports({
    type: activeTab,
    species: speciesFilter || undefined,
    search: search || undefined,
  });

  const { data: myPetsData } = usePets({ limit: 100 });
  const createReportMutation = useCreateLostFoundReport();
  const sendInquiryMutation = useSendLostFoundInquiry();
  const resolveMutation = useResolveLostFoundReport();
  const { data: matches, isLoading: loadingMatches } = useLostFoundMatches(matchingReportId || undefined);

  const reports = reportsData?.data || [];
  const myPets = myPetsData?.data || [];

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAddress || !formDescription) {
      toast.error('Please fill in the required location and description.');
      return;
    }

    createReportMutation.mutate(
      {
        type: reportModalType || 'lost',
        petId: selectedPetId || undefined,
        petName: formPetName || undefined,
        species: formSpecies,
        breed: formBreed || undefined,
        color: formColor || undefined,
        gender: formGender,
        location: {
          coordinates: [77.5946, 12.9716], // Default geo coordinates
          address: formAddress,
        },
        eventDate: formDate,
        description: formDescription,
        photos: formPhotoUrl ? [formPhotoUrl] : [],
      },
      {
        onSuccess: () => {
          toast.success(
            reportModalType === 'lost'
              ? 'Lost pet alert posted to the community network!'
              : 'Found pet report published! Thank you for helping.'
          );
          setReportModalType(null);
          resetForm();
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error?.message || 'Failed to submit report');
        },
      }
    );
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactReport || !inquiryMessage.trim()) return;

    sendInquiryMutation.mutate(
      {
        id: contactReport._id,
        data: {
          message: inquiryMessage,
          contactInfo: inquiryContactInfo || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Inquiry sent securely to the reporter!');
          setContactReport(null);
          setInquiryMessage('');
          setInquiryContactInfo('');
        },
        onError: () => toast.error('Failed to send message'),
      }
    );
  };

  const handleResolve = (id: string) => {
    if (confirm('Mark this case as resolved? The pet is confirmed safe.')) {
      resolveMutation.mutate(id, {
        onSuccess: () => toast.success('Report resolved! Glad the pet is safe.'),
        onError: () => toast.error('Failed to resolve report'),
      });
    }
  };

  const resetForm = () => {
    setSelectedPetId('');
    setFormPetName('');
    setFormSpecies('dog');
    setFormBreed('');
    setFormColor('');
    setFormGender('unknown');
    setFormAddress('');
    setFormDescription('');
    setFormPhotoUrl('');
  };

  return (
    <div className="container-page py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Lost & Found Network
              </h1>
              <p className="text-sm text-muted mt-1">
                Real-time community search, verified safety alerts, and intelligent pet matching
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setReportModalType('lost');
              resetForm();
            }}
            className="flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            <ShieldAlert className="w-4 h-4" /> Report Lost Pet
          </button>
          <button
            onClick={() => {
              setReportModalType('found');
              resetForm();
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all"
          >
            <HeartHandshake className="w-4 h-4" /> Report Found Pet
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 border-b border-border w-full md:w-auto">
          <button
            onClick={() => setActiveTab('lost')}
            className={cn(
              'px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'lost'
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            <AlertTriangle className="w-4 h-4" /> Lost Pets
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={cn(
              'px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2',
              activeTab === 'found'
                ? 'border-emerald-500 text-emerald-500'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            <HeartHandshake className="w-4 h-4" /> Found Animals
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by breed, name, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
          >
            <option value="">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="rabbit">Rabbits</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 h-64 animate-pulse bg-muted/10 rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
          <h3 className="text-lg font-bold text-foreground">
            No active {activeTab} pet alerts
          </h3>
          <p className="text-sm text-muted mt-1 max-w-md">
            There are currently no reported {activeTab} animals in this category. All clear!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <div
              key={report._id}
              className="card overflow-hidden border border-border hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Photo or placeholder */}
                <div className="aspect-video w-full relative bg-muted/20 overflow-hidden">
                  {report.photos && report.photos.length > 0 ? (
                    <img
                      src={report.photos[0]}
                      alt={report.petName || report.species}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                      <HelpCircle className="w-10 h-10 opacity-30 mb-1" />
                      <span className="text-xs">No Photo Available</span>
                    </div>
                  )}

                  <span
                    className={cn(
                      'absolute top-3 left-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm tracking-wider',
                      report.type === 'lost'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    )}
                  >
                    {report.type}
                  </span>

                  {report.status === 'resolved' && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-900/80 text-emerald-400">
                      Resolved
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground capitalize">
                      {report.petName || `Unknown ${report.species}`}
                    </h3>
                    <p className="text-xs text-muted">
                      {report.species} {report.breed ? `• ${report.breed}` : ''}{' '}
                      {report.color ? `• ${report.color}` : ''}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{report.location.address}</span>
                    </p>
                    <p className="text-[11px] text-muted">
                      Last seen: {report.eventDate}
                    </p>
                  </div>

                  <p className="text-xs text-foreground/80 line-clamp-3 bg-muted/5 p-2.5 rounded-xl border border-border/40">
                    "{report.description}"
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-border flex items-center justify-between gap-2 bg-muted/5">
                <button
                  onClick={() => setMatchingReportId(report._id)}
                  className="px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Matches
                </button>

                <div className="flex items-center gap-2">
                  {user && user._id === report.reporterId && report.status !== 'resolved' ? (
                    <button
                      onClick={() => handleResolve(report._id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                    >
                      Mark Safe
                    </button>
                  ) : (
                    <button
                      onClick={() => setContactReport(report)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-sm transition-all flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Contact
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Match Candidates Modal */}
      {matchingReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Potential Matches (Smart Matching Algorithm)
                </h3>
              </div>
              <button
                onClick={() => setMatchingReportId(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
              {loadingMatches ? (
                <div className="text-center py-8 text-sm text-muted">Calculating similarity scores...</div>
              ) : !matches || matches.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted">
                  No matching opposite reports found in this radius yet. We will notify you when a match appears.
                </div>
              ) : (
                matches.map(({ report, score }) => (
                  <div
                    key={report._id}
                    className="p-4 rounded-xl border border-border bg-background flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-muted/20 overflow-hidden shrink-0">
                        {report.photos && report.photos[0] ? (
                          <img
                            src={report.photos[0]}
                            alt={report.species}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted">
                            No photo
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground capitalize">
                            {report.petName || report.species}
                          </h4>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                              score >= 70
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                            )}
                          >
                            {score}% Match
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {report.breed || 'Unknown breed'} • {report.location.address}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setMatchingReportId(null);
                        setContactReport(report);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-xl shrink-0"
                    >
                      Inquire
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secure In-App Contact Dialog */}
      {contactReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Send Secure Inquiry to Reporter
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Regarding {contactReport.type} pet "{contactReport.petName || contactReport.species}"
                </p>
              </div>
              <button
                onClick={() => setContactReport(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInquiry} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="I think I saw this pet near... / I have information about this pet..."
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">
                  Your Callback Info (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Phone number or preferred email"
                  value={inquiryContactInfo}
                  onChange={(e) => setInquiryContactInfo(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted mt-1">
                  Private & secure: Only shared with this verified reporter.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setContactReport(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendInquiryMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground capitalize">
                  Report {reportModalType} Pet
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Publish a community safety bulletin across PetVerse
                </p>
              </div>
              <button
                onClick={() => setReportModalType(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 mt-4">
              {reportModalType === 'lost' && myPets.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1 uppercase tracking-wider">
                    Select Your Registered Pet (Optional)
                  </label>
                  <select
                    value={selectedPetId}
                    onChange={(e) => {
                      const petId = e.target.value;
                      setSelectedPetId(petId);
                      const pet = myPets.find((p) => p._id === petId);
                      if (pet) {
                        setFormPetName(pet.name);
                        setFormSpecies((pet.species as any) || 'dog');
                        setFormBreed(pet.breed || '');
                        setFormColor(pet.color || '');
                        setFormGender(pet.gender as any);
                        if (pet.avatar) setFormPhotoUrl(pet.avatar);
                      }
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    <option value="">-- Choose one of my pets --</option>
                    {myPets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.species} • {p.breed || 'Unknown breed'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Pet Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Barnaby"
                    value={formPetName}
                    onChange={(e) => setFormPetName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Species *
                  </label>
                  <select
                    value={formSpecies}
                    onChange={(e) => setFormSpecies(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                    required
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Breed</label>
                  <input
                    type="text"
                    placeholder="e.g. Golden Retriever"
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Tan / White"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Location (Address / Cross Streets) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Park West near 81st Street, Austin, TX"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formPhotoUrl}
                    onChange={(e) => setFormPhotoUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description / Distinguishing Marks *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Collar color, microchip number, unique markings, behavioral notes..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReportModalType(null)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createReportMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-sm"
                >
                  {createReportMutation.isPending ? 'Publishing...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}