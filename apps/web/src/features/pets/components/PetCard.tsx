import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PawPrint, Calendar, Weight, Activity, MoreVertical, Edit2, Trash2, Camera } from 'lucide-react';
import type { IPet } from '@petverse/shared-types';
import { cn } from '@/shared/utils/cn';
import { calculateAge } from '@/shared/utils/date';

interface PetCardProps {
  pet: IPet;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  const age = pet.dob ? calculateAge(pet.dob) : 'Unknown age';
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="card-interactive overflow-hidden group"
    >
      <div className="relative h-32 w-full bg-gradient-to-r from-primary/20 to-accent/20">
        {pet.avatar ? (
          <img 
            src={pet.avatar} 
            alt={pet.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <PawPrint className="h-16 w-16 text-foreground" />
          </div>
        )}
        
        {/* Actions Menu */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            {onEdit && (
              <button 
                onClick={(e) => { e.preventDefault(); onEdit(pet._id); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 backdrop-blur-sm text-foreground hover:bg-surface hover:text-primary transition-colors shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.preventDefault(); onDelete(pet._id); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 backdrop-blur-sm text-foreground hover:bg-surface hover:text-danger transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">{pet.name}</h3>
            <p className="text-sm font-medium text-primary">{pet.breed || pet.species}</p>
          </div>
          <span className={cn(
            'px-2 py-1 text-xs font-semibold rounded-full',
            pet.gender === 'male' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
            pet.gender === 'female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' :
            'bg-surface-3 text-foreground-2'
          )}>
            {pet.gender}
          </span>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-fg">
            <Calendar className="h-4 w-4 text-muted" />
            <span>{age}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-fg">
            <Weight className="h-4 w-4 text-muted" />
            <span>{pet.weight ? `${pet.weight} kg` : 'N/A'}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
