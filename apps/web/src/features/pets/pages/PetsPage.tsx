import { useSearchParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, PawPrint, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePets, useDeletePet } from '../hooks/usePets';
import { PetCard } from '../components/PetCard';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { toast } from 'sonner';
import { useDebounce } from '@/shared/hooks/useDebounce';

type SortOption = 'createdAt-desc' | 'createdAt-asc' | 'name-asc' | 'name-desc';

export default function PetsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State for queries
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchInput, 400);
  const [speciesFilter, setSpeciesFilter] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortOption>('createdAt-desc');

  // Sync state if URL changes externally
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== searchInput) {
      setSearchInput(q);
    }
  }, [searchParams]);

  // Parse sort option
  const [sortBy, sortOrder] = useMemo(() => sortOption.split('-') as [string, 'asc'|'desc'], [sortOption]);

  const { data: petsResponse, isLoading, error } = usePets({
    search: debouncedSearch || undefined,
    species: speciesFilter || undefined,
    sortBy,
    sortOrder,
    page: 1,
    limit: 50,
  });
  
  const pets = petsResponse?.data;
  const deletePet = useDeletePet();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
      deletePet.mutate(id, {
        onSuccess: () => toast.success('Pet removed successfully'),
        onError: () => toast.error('Failed to remove pet'),
      });
    }
  };

  return (
    <div className="container-page py-8">
      <div className="section-header flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Pets</h1>
          <p className="text-sm text-muted">Manage your furry, feathered, or scaly family members.</p>
        </div>
        
        <Link
          to="/pets/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Pet</span>
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search pets by name or breed..."
            className="input pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0">
          <div className="relative shrink-0">
            <select 
              value={speciesFilter}
              onChange={(e) => setSpeciesFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-surface px-4 py-2 pr-10 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">All Species</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
              <option value="reptile">Reptile</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted" />
          </div>

          <div className="relative shrink-0">
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="appearance-none rounded-lg border border-border bg-surface px-4 py-2 pr-10 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="createdAt-desc">Newest Added</option>
              <option value="createdAt-asc">Oldest Added</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted" />
          </div>
        </div>
      </div>

      {/* State handling */}
      {error && (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-center text-danger">
          <p className="font-medium">Failed to load pets.</p>
          <p className="text-sm">Please try again later.</p>
        </div>
      )}

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && (!pets || pets.length === 0) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card flex flex-col items-center justify-center p-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PawPrint className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No pets found</h3>
          <p className="mt-2 text-sm text-muted max-w-md">
            {debouncedSearch || speciesFilter 
              ? "We couldn't find any pets matching your filters." 
              : "You haven't added any pets yet. Add your first pet to start tracking their health, appointments, and more."}
          </p>
          {!(debouncedSearch || speciesFilter) && (
            <Link
              to="/pets/new"
              className="mt-6 flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Your First Pet
            </Link>
          )}
          {(debouncedSearch || speciesFilter) && (
            <button
              onClick={() => {
                setSearchInput('');
                setSpeciesFilter('');
              }}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </motion.div>
      )}

      {!isLoading && !error && pets && pets.length > 0 && (
        <motion.div 
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {pets.map(pet => (
              <motion.div
                key={pet._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Link to={`/pets/${pet._id}`} className="block h-full">
                  <PetCard 
                    pet={pet} 
                    onEdit={(id) => navigate(`/pets/${id}/edit`)}
                    onDelete={handleDelete}
                  />
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
