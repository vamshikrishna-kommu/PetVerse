import React, { useState } from 'react';
import { useLogAdministration } from '../hooks/useMedication';


interface AdministrationLoggerProps {
  petId: string;
  courseId: string;
  onClose: () => void;
}

export function AdministrationLogger({ petId, courseId, onClose }: AdministrationLoggerProps) {
  const { mutate: logAdmin, isPending } = useLogAdministration(petId, courseId);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logAdmin({
      status: 'taken',
      administeredAt: new Date().toISOString(),
      notes
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-xl border">
        <h2 className="text-xl font-bold mb-4">Log Administration</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800" disabled>
              <option>Taken</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea 
              className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any side effects or comments?"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800" onClick={onClose} disabled={isPending}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" disabled={isPending}>
              {isPending ? 'Logging...' : 'Log Dose'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
