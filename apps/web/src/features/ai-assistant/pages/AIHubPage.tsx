import { Link } from 'react-router-dom';
import { Sparkles, Stethoscope, Camera, Utensils, ShieldAlert, ArrowRight, HeartPulse, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIHubPage() {
  const tools = [
    {
      id: 'symptom-checker',
      title: 'AI Symptom Checker & Triage',
      description: 'Describe your pet’s symptoms and get clinical triage urgency, emergency red flags, and home care recommendations.',
      icon: Stethoscope,
      href: '/ai/assistant',
      badge: 'Clinical Triage',
      color: 'from-blue-500/20 to-indigo-500/20 text-blue-500 border-blue-500/30',
      actionText: 'Check Symptoms',
    },
    {
      id: 'breed-scan',
      title: 'Smart Breed Recognition',
      description: 'Upload a photo to identify breed lineage, temperaments, genetic health predispositions, and personalized care guidelines.',
      icon: Camera,
      href: '/ai/breed-scan',
      badge: 'Visual Model',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-500 border-purple-500/30',
      actionText: 'Scan Pet Photo',
    },
    {
      id: 'diet-planner',
      title: 'Precision Diet & Calorie Planner',
      description: 'Formulate veterinary nutrition plans, daily kcal requirements, meal portion sizes, and toxicity warnings tailored to your pet.',
      icon: Utensils,
      href: '/ai/diet-recommend',
      badge: 'Veterinary Nutrition',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
      actionText: 'Calculate Diet Plan',
    },
  ];

  return (
    <div className="container-page py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
          <Sparkles className="h-3.5 w-3.5" />
          PetVerse Clinical Intelligence
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
          AI-Powered Pet Health Intelligence
        </h1>
        <p className="mt-3 text-sm text-muted">
          Advanced veterinary triage, breed lineage estimation, and precision nutrition calculators developed to assist pet parents in everyday wellness decisions.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="card p-4 mb-8 bg-amber-500/10 border-amber-500/30 flex items-start gap-3 rounded-2xl">
        <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-foreground/90 space-y-1">
          <p className="font-semibold text-amber-600 dark:text-amber-400">Important Medical Notice & Safety Standard</p>
          <p className="text-muted leading-relaxed">
            PetVerse AI tools provide educational triage guidance and algorithmic wellness insights. They do not replace professional in-person veterinary examination, diagnostic tests, or emergency medicine. If your pet exhibits severe trauma, collapse, or difficulty breathing, visit an emergency animal hospital immediately.
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6 flex flex-col justify-between border-border hover:border-primary/40 transition-all hover:shadow-lg group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br border ${tool.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="badge text-[11px] font-semibold bg-surface-2 text-foreground/80 border-border">
                    {tool.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {tool.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <Link
                to={tool.href}
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 rounded-xl"
              >
                {tool.actionText}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Key Features Banner */}
      <div className="card p-6 bg-surface-2/60 border-border rounded-2xl">
        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          Clinical Guardrails & Privacy Commitments
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted">
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Server-side verified AI pipeline with zero client credential exposure.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Automatic fallback to certified clinical rule matrices during network outages.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>Red-flag symptom detector prioritizing direct veterinary intervention.</span>
          </div>
        </div>
      </div>
    </div>
  );
}