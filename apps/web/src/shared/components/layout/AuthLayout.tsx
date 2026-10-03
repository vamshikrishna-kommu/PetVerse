import { motion } from 'framer-motion';
import { Heart, Sparkles, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Left Pane - Branding & Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-secondary/30 border-r border-border/50 items-center justify-center p-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-md relative z-10 space-y-8">
          <Link to="/" className="flex items-center gap-2 mb-12 inline-flex">
            <Heart className="w-8 h-8 text-indigo-500 fill-indigo-500" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              PetVerse
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold leading-tight">
            The intelligent operating system for modern pet care.
          </h1>
          
          <p className="text-lg text-muted">
            Join thousands of pet parents who use PetVerse to track health, manage reminders, and give their pets the premium care they deserve.
          </p>
          
          <div className="space-y-4 pt-8">
            {[
              'Unified medical records & vaccine tracking',
              'Smart automated reminders',
              'AI-powered diet & health insights'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 font-medium text-foreground">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                {feature}
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 rounded-2xl bg-card border border-border/50 shadow-xl relative">
            <Sparkles className="w-5 h-5 text-purple-500 absolute top-4 right-4" />
            <p className="italic text-muted-foreground mb-4">
              "PetVerse completely changed how we manage Bella's health. The AI insights are incredibly helpful."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-indigo-500">
                SJ
              </div>
              <div>
                <div className="font-bold text-sm">Sarah Jenkins</div>
                <div className="text-xs text-muted">Golden Retriever Mom</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <Link to="/" className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-indigo-500 fill-indigo-500" />
          <span className="text-xl font-bold">PetVerse</span>
        </Link>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
