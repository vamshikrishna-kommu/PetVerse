import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePets } from '@/features/pets/hooks/usePets';
import { aiApi, type SymptomAnalysisResponse } from '@/services/api/aiApi';
import {
  Stethoscope,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Info,
  MessageSquare,
  Send,
  RefreshCw,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isEmergency?: boolean;
  redFlags?: string[];
  actions?: string[];
}

export default function AIAssistantPage() {
  const { data: petsData } = usePets();
  const petList = petsData?.data || [];

  const [activeTab, setActiveTab] = useState<'chat' | 'symptoms'>('chat');
  const [selectedPetId, setSelectedPetId] = useState<string>('');

  // ─── Conversational AI State ─────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm PetVerse AI, your veterinary-guided pet care assistant. How can I help you today with your pet's wellness, nutrition, or behavior? You can ask about diets, normal behavior, or general symptoms.",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [hasEmergencyInChat, setHasEmergencyInChat] = useState(false);

  // ─── Symptom Checker State ──────────────────────────────────
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other'>('dog');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [duration, setDuration] = useState<'hours' | 'days' | 'weeks' | 'chronic'>('days');
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [petAgeMonths, setPetAgeMonths] = useState<number>(24);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResponse | null>(null);

  const commonSymptoms = [
    'Vomiting',
    'Diarrhea',
    'Lethargy / Sluggishness',
    'Loss of Appetite',
    'Limping / Difficulty Walking',
    'Coughing / Wheezing',
    'Scratching / Skin Irritation',
    'Excessive Thirst',
    'Eye Discharge',
    'Ear Shaking / Odor',
    'Sneezing',
    'Restlessness / Pacing',
  ];

  const quickPromptChips = [
    'What human foods are toxic to dogs?',
    'My cat has been sluggish and not eating for 24h',
    'How do I introduce a new puppy to an older dog?',
    'Recommended preventive vaccine schedule',
  ];

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
    if (!petId) return;
    const pet = petList.find((p) => p._id === petId);
    if (pet) {
      if (pet.species === 'dog' || pet.species === 'cat') {
        setSpecies(pet.species);
      } else {
        setSpecies('other');
      }
      if (pet.dob) {
        const diffMonths = Math.max(
          1,
          Math.floor((Date.now() - new Date(pet.dob).getTime()) / (1000 * 60 * 60 * 24 * 30))
        );
        setPetAgeMonths(diffMonths);
      }
    }
  };

  const handleSendChat = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isChatLoading) return;

    const updatedMessages: ChatMessage[] = [...chatMessages, { role: 'user', content: text }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const selectedPet = petList.find((p) => p._id === selectedPetId);
      const res = await aiApi.chat({
        messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        petContext: selectedPet
          ? {
              name: selectedPet.name,
              species: selectedPet.species,
              breed: selectedPet.breed,
              weightKg: selectedPet.weight,
            }
          : undefined,
      });

      if (res.isEmergency) {
        setHasEmergencyInChat(true);
      }

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.message,
          isEmergency: res.isEmergency,
          redFlags: res.detectedRedFlags,
          actions: res.suggestedActions,
        },
      ]);
    } catch {
      toast.error('Could not reach AI assistant. Please try again.');
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I encountered a temporary error reaching the AI service. If your pet is showing critical signs of distress, please contact your local veterinarian or 24/7 animal hospital directly.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const addCustomSymptom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error('Please select or add at least one symptom.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await aiApi.analyzeSymptoms({
        species,
        symptoms: selectedSymptoms,
        duration,
        severity,
        petAgeMonths,
        additionalNotes: additionalNotes.trim() || undefined,
      });
      setResult(data);
    } catch {
      toast.error('Failed to analyze symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content:
          "Conversation cleared. How else may I assist with your pet's health, nutrition, or behavioral care today?",
      },
    ]);
    setHasEmergencyInChat(false);
  };

  return (
    <div className="container-page py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/ai"
            className="p-2 rounded-xl border border-border hover:bg-surface-2 transition-colors text-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              PetVerse AI Assistant & Clinical Triage
            </h1>
            <p className="text-xs text-muted mt-0.5">
              Veterinary guidance, intelligent symptom triage, and round-the-clock pet health insights.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            AI Chat Assistant
          </button>
          <button
            onClick={() => setActiveTab('symptoms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'symptoms'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Symptom Checker
          </button>
        </div>
      </div>

      {/* Pet Selector Bar (Applies to both Chat and Triage) */}
      {petList.length > 0 && (
        <div className="card p-3 mb-6 bg-surface-2/40 border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted">
            <span className="font-semibold text-foreground">Active Pet Profile:</span>
            <span>Attach pet vitals to tailor recommendations</span>
          </div>
          <select
            value={selectedPetId}
            onChange={(e) => handlePetSelect(e.target.value)}
            className="input py-1 text-xs max-w-xs"
          >
            <option value="">No pet selected (General inquiry)</option>
            {petList.map((pet) => (
              <option key={pet._id} value={pet._id}>
                {pet.name} ({pet.species} • {pet.breed || 'Mixed'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ─── TAB 1: Conversational AI Assistant ──────────────────────── */}
      {activeTab === 'chat' && (
        <div className="space-y-6">
          {/* Emergency Alert Banner */}
          {hasEmergencyInChat && (
            <div className="card p-4 bg-danger/10 border-danger/30 rounded-2xl flex items-start justify-between gap-4 animate-in fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-danger">Critical Clinical Alert Detected</p>
                  <p className="text-foreground/90">
                    The symptoms you described may require emergency veterinary attention. Do not delay medical care.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/emergency"
                  className="btn-danger py-1.5 px-3 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  Emergency Center
                </Link>
                <Link
                  to="/nearby"
                  className="btn-secondary py-1.5 px-3 text-xs font-semibold rounded-xl flex items-center gap-1"
                >
                  Find Clinic
                </Link>
              </div>
            </div>
          )}

          {/* Chat Container */}
          <div className="card border-border flex flex-col h-[600px] overflow-hidden">
            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {chatMessages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isUser
                          ? 'bg-primary text-white shadow-sm'
                          : msg.isEmergency
                          ? 'bg-danger/20 text-danger border border-danger/30'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>

                    <div className={`max-w-[80%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`p-4 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-primary text-white rounded-tr-none shadow-md'
                            : msg.isEmergency
                            ? 'bg-danger/10 border border-danger/30 text-foreground rounded-tl-none'
                            : 'bg-surface-2 text-foreground border border-border rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Suggested Actions if returned by AI */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/60 space-y-1">
                            <span className="font-semibold block text-[11px] text-foreground">
                              Recommended Care Steps:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                              {msg.actions.map((act, i) => (
                                <li key={i}>{act}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isChatLoading && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 animate-pulse" />
                  </div>
                  <div className="p-3 bg-surface-2 rounded-2xl rounded-tl-none border border-border text-xs text-muted flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                    <span>PetVerse AI is formulating clinical guidance...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 border-t border-border bg-surface-2/30 flex items-center gap-2 overflow-x-auto text-[11px]">
              <span className="text-muted shrink-0 font-medium">Quick Prompts:</span>
              {quickPromptChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendChat(chip)}
                  disabled={isChatLoading}
                  className="px-2.5 py-1 rounded-full bg-surface border border-border hover:border-primary/50 text-foreground/80 hover:text-primary transition whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="p-4 border-t border-border bg-surface flex items-center gap-3"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask PetVerse AI about diet, symptoms, wellness, behavior..."
                disabled={isChatLoading}
                className="input flex-1 text-xs"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="btn-primary py-2.5 px-4 text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Send
              </button>
              <button
                type="button"
                onClick={resetChat}
                title="Reset Conversation"
                className="p-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:bg-surface-2 transition"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Mandatory Veterinary Disclaimer */}
          <div className="p-3 bg-surface-2/60 border border-border rounded-xl text-[11px] text-muted flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" />
            <p className="leading-relaxed">
              PetVerse AI provides educational triage guidance and does NOT formulate definitive clinical diagnoses or prescribe medication. In serious trauma or acute distress, contact a licensed emergency veterinarian immediately.
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Structured Symptom Checker Form ──────────────────── */}
      {activeTab === 'symptoms' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Form Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step 1: Pet Profile */}
            <div className="card p-6 border-border">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Pet Information
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setSpecies('dog')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    species === 'dog'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-2 text-muted border-border hover:text-foreground'
                  }`}
                >
                  Canine (Dog)
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
                  Feline (Cat)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Approximate Age (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={petAgeMonths}
                  onChange={(e) => setPetAgeMonths(Number(e.target.value))}
                  className="input w-full text-xs"
                />
              </div>
            </div>

            {/* Step 2: Observed Symptoms */}
            <div className="card p-6 border-border">
              <h2 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Observed Symptoms
              </h2>
              <p className="text-xs text-muted mb-4">Select all clinical signs exhibited by your pet.</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {commonSymptoms.map((sym) => {
                  const isSelected = selectedSymptoms.includes(sym);
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => toggleSymptom(sym)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary text-primary font-semibold'
                          : 'bg-surface-2 border-border text-foreground hover:bg-surface-3'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={addCustomSymptom} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Other symptom (e.g., pale gums, twitching)..."
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="input flex-1 text-xs"
                />
                <button type="submit" className="btn-secondary text-xs px-3 font-semibold">
                  Add
                </button>
              </form>
            </div>

            {/* Step 3: Duration & Severity */}
            <div className="card p-6 border-border space-y-4">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Duration & Severity
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Onset Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as any)}
                    className="input w-full text-xs"
                  >
                    <option value="hours">&lt; 24 Hours</option>
                    <option value="days">1 - 3 Days</option>
                    <option value="weeks">1 - 2 Weeks</option>
                    <option value="chronic">Chronic (&gt; 2 Weeks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Observed Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="input w-full text-xs"
                  >
                    <option value="mild">Mild (Eating, active)</option>
                    <option value="moderate">Moderate (Low energy)</option>
                    <option value="severe">Severe (Distress, collapsed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Additional Observations (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Diet changes, known toxin exposure, unusual behavior..."
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="input w-full text-xs resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || selectedSymptoms.length === 0}
                className="btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <Stethoscope className="h-4 w-4" />
                {isLoading ? 'Analyzing Clinical Signs...' : 'Perform Triage Analysis'}
              </button>
            </div>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6">
            {result ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Urgency Badge Header */}
                <div
                  className={`card p-6 border rounded-2xl ${
                    result.triageUrgency === 'EMERGENCY'
                      ? 'bg-danger/10 border-danger/40 text-danger'
                      : result.triageUrgency === 'URGENT'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="badge text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg">
                      {result.triageUrgency} TRIAGE
                    </span>
                    <span className="text-[11px] opacity-80 font-medium">Source: {result.generatedBy}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{result.summary}</h3>
                </div>

                {/* Red Flags Alert */}
                {result.redFlags && result.redFlags.length > 0 && (
                  <div className="card p-5 bg-red-500/10 border-red-500/30 rounded-2xl space-y-2">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Red Flags to Watch
                    </h4>
                    <ul className="space-y-1 text-xs text-foreground/90">
                      {result.redFlags.map((rf, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Potential Considerations */}
                <div className="card p-5 border-border">
                  <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Potential Considerations
                  </h3>
                  <ul className="space-y-2 text-xs text-muted">
                    {result.potentialConsiderations.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Actions */}
                <div className="card p-5 border-border">
                  <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-500" />
                    Recommended Actions
                  </h3>
                  <ul className="space-y-2 text-xs text-muted">
                    {result.recommendedActions.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-foreground/90">
                        <span className="h-5 w-5 rounded-full bg-surface-2 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Questions for Veterinarian */}
                {result.questionsForVeterinarian && result.questionsForVeterinarian.length > 0 && (
                  <div className="card p-5 border-border">
                    <h3 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-500" />
                      Questions to Ask Your Veterinarian
                    </h3>
                    <ul className="space-y-1.5 text-xs text-muted">
                      {result.questionsForVeterinarian.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-foreground/80 italic">
                          <span>•</span>
                          <span>"{q}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Booking CTA */}
                <div className="card p-5 bg-primary/5 border-primary/20 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Need to book an in-person visit?</h4>
                    <p className="text-xs text-muted mt-0.5">Find available slots at verified veterinary clinics near you.</p>
                  </div>
                  <Link
                    to="/appointments/book"
                    className="btn-primary text-xs font-semibold px-4 py-2.5 rounded-xl shrink-0 flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Book Vet Appointment
                  </Link>
                </div>

                {/* Mandatory Veterinary Disclaimer */}
                <div className="p-3 bg-surface-2/60 border border-border rounded-xl text-[11px] text-muted flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                  <p className="leading-relaxed">{result.disclaimer}</p>
                </div>
              </div>
            ) : (
              <div className="card p-12 border-border border-dashed text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="p-4 rounded-2xl bg-surface-2 mb-4 text-muted">
                  <Stethoscope className="h-8 w-8 text-primary/60" />
                </div>
                <h3 className="text-base font-bold text-foreground">Ready for Clinical Triage</h3>
                <p className="text-xs text-muted max-w-sm mt-1.5 leading-relaxed">
                  Select your pet's observed signs on the left and submit. The AI triage engine evaluates emergency factors, duration, and clinical warning signs.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}