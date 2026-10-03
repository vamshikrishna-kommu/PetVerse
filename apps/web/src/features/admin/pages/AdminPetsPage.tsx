import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PawPrint,
  Search,
  Filter,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import type { IPet } from '@petverse/shared-types';

export default function AdminPetsPage() {
  const [pets, setPets] = useState<IPet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .listAllPets({ search: search || undefined })
      .then((res) => setPets(res.data || []))
      .catch((err) => console.error('Failed to load pets', err))
      .finally(() => setIsLoading(false));
  }, [search]);

  const filteredPets = pets.filter((p) => {
    if (speciesFilter !== 'all' && p.species !== speciesFilter) return false;
    return true;
  });

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <PawPrint className="w-8 h-8 text-accent" /> Pet Registry & Moderation
          </h1>
          <p className="text-muted text-sm mt-1">
            Global view of registered domestic pets, clinical identifiers, and emergency status flags.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <span className="font-semibold text-muted">Species:</span>
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="input py-1.5 px-3 text-xs capitalize"
          >
            <option value="all">All Species</option>
            <option value="dog">Dogs</option>
            <option value="cat">Cats</option>
            <option value="bird">Birds</option>
            <option value="rabbit">Rabbits</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by pet name, breed..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Pets Table */}
      <div className="card border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-muted border-b border-border uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Pet</th>
                <th className="py-3 px-4">Species & Breed</th>
                <th className="py-3 px-4">Gender & Age</th>
                <th className="py-3 px-4">Owner ID</th>
                <th className="py-3 px-4">Lost Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPets.map((pet) => (
                <tr key={pet._id} className="hover:bg-surface-2/60 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-3 border border-border overflow-hidden flex items-center justify-center font-bold text-primary">
                        {pet.avatar ? (
                          <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{pet.name[0]}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{pet.name}</div>
                        {pet.microchipId && (
                          <span className="text-[10px] font-mono text-muted">
                            Chip: {pet.microchipId}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="capitalize font-semibold text-foreground">{pet.species}</div>
                    <div className="text-muted text-[11px]">{pet.breed || 'Mixed'}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="capitalize text-foreground">{pet.gender}</div>
                    <div className="text-muted text-[11px]">{pet.dob ? new Date(pet.dob).toLocaleDateString() : pet.estimatedAge || '—'}</div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-muted">
                    {pet.ownerId.slice(-8)}
                  </td>

                  <td className="py-3 px-4">
                    {pet.isLost ? (
                      <span className="badge bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold">
                        LOST
                      </span>
                    ) : (
                      <span className="badge bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold">
                        Safe
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/pets/${pet._id}`}
                      className="text-primary hover:text-primary-hover font-semibold inline-flex items-center gap-1"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPets.length === 0 && !isLoading && (
          <div className="py-16 text-center space-y-3">
            <PawPrint className="w-12 h-12 text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">No Pets Found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No registered domestic animals match your search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
