import { flexibleDate, createPetSchema, updatePetSchema } from '../pet.routes';
import { petService } from '../pet.service';
import { petRepository } from '../pet.repository';
import { TimelineService } from '../timeline.service';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';

describe('Pet CRUD & Date Validation Tests', () => {
  describe('1. flexibleDate Schema Validator (Root Cause Fix)', () => {
    it('accepts YYYY-MM-DD date input string and coerces to ISO 8601', () => {
      const parsed = flexibleDate.parse('2023-05-15');
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('string');
      expect(new Date(parsed!).toISOString()).toBe(parsed);
      expect(new Date(parsed!).getFullYear()).toBe(2023);
    });

    it('accepts full ISO 8601 datetime strings', () => {
      const iso = '2023-05-15T12:00:00.000Z';
      const parsed = flexibleDate.parse(iso);
      expect(parsed).toBe(iso);
    });

    it('gracefully handles undefined, null, and empty strings', () => {
      expect(flexibleDate.parse(undefined)).toBeUndefined();
      expect(flexibleDate.parse(null)).toBeUndefined();
      expect(flexibleDate.parse('')).toBeUndefined();
    });

    it('rejects invalid date strings', () => {
      expect(() => flexibleDate.parse('not-a-valid-date')).toThrow();
      expect(() => flexibleDate.parse('hello-world')).toThrow();
    });
  });

  describe('2. createPetSchema Route Validation', () => {
    it('accepts payload from AddPetPage containing YYYY-MM-DD dob', () => {
      const formPayload = {
        name: 'Milo',
        species: 'dog',
        breed: 'Golden Retriever',
        gender: 'male',
        dob: '2022-03-10',
        weight: 22.5,
        color: 'Golden',
        isVaccinated: true,
        isSterilized: false,
        lifestyle: 'indoor',
        activityLevel: 'high',
      };

      const result = createPetSchema.safeParse(formPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Milo');
        expect(result.data.species).toBe('dog');
        expect(result.data.dob).toContain('2022-03-10');
        expect(result.data.weight).toBe(22.5);
      }
    });

    it('accepts minimal required pet creation fields and applies defaults', () => {
      const minimalPayload = {
        name: 'Luna',
        species: 'cat',
      };

      const result = createPetSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Luna');
        expect(result.data.species).toBe('cat');
        expect(result.data.gender).toBe('unknown');
        expect(result.data.lifestyle).toBe('indoor');
        expect(result.data.isVaccinated).toBe(false);
        expect(result.data.isSterilized).toBe(false);
        expect(result.data.isPublicProfile).toBe(true);
      }
    });

    it('rejects empty pet name', () => {
      const result = createPetSchema.safeParse({
        name: '',
        species: 'dog',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid species', () => {
      const result = createPetSchema.safeParse({
        name: 'Rocky',
        species: 'dragon',
      });
      expect(result.success).toBe(false);
    });

    it('accepts adoptionDate and insuranceExpiry as YYYY-MM-DD strings', () => {
      const result = createPetSchema.safeParse({
        name: 'Bella',
        species: 'dog',
        adoptionDate: '2023-01-01',
        insuranceExpiry: '2025-01-01',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.adoptionDate).toBeDefined();
        expect(result.data.insuranceExpiry).toBeDefined();
      }
    });
  });

  describe('3. updatePetSchema Route Validation (Edit Pet)', () => {
    it('accepts partial updates including health, lifestyle, and basic fields', () => {
      const updatePayload = {
        name: 'Milo Updated',
        weight: 23.8,
        allergies: ['Chicken', 'Pollen'],
        isVaccinated: true,
        behaviorNotes: 'Loves chasing balls in the park',
      };

      const result = updatePetSchema.safeParse(updatePayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Milo Updated');
        expect(result.data.weight).toBe(23.8);
        expect(result.data.allergies).toEqual(['Chicken', 'Pollen']);
        expect(result.data.behaviorNotes).toBe('Loves chasing balls in the park');
      }
    });

    it('allows updating dob with YYYY-MM-DD string', () => {
      const result = updatePetSchema.safeParse({
        dob: '2021-08-20',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dob).toContain('2021-08-20');
      }
    });
  });

  describe('4. Pet Service CRUD & Authorization', () => {
    const ownerId = '507f1f77bcf86cd799439011';
    const otherUserId = '507f1f77bcf86cd799439022';
    const petId = '507f1f77bcf86cd799439033';

    const mockPet = {
      _id: petId,
      ownerId,
      name: 'Buddy',
      species: 'dog',
      weight: 15,
      toJSON: function () {
        return {
          _id: this._id,
          ownerId: this.ownerId,
          name: this.name,
          species: this.species,
          weight: this.weight,
        };
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('createPet persists pet and logs timeline creation event', async () => {
      jest.spyOn(petRepository, 'create').mockResolvedValue(mockPet as any);
      const addEventSpy = jest.spyOn(TimelineService, 'addEvent').mockResolvedValue({} as any);

      const pet = await petService.createPet(ownerId, {
        name: 'Buddy',
        species: 'dog',
        weight: 15,
      });

      expect(petRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId,
          name: 'Buddy',
          species: 'dog',
        })
      );
      expect(addEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          petId,
          type: 'created',
          title: 'Profile Created',
        })
      );
      expect(pet.name).toBe('Buddy');
    });

    it('getPetById returns pet for rightful owner', async () => {
      jest.spyOn(petRepository, 'findById').mockResolvedValue(mockPet as any);

      const pet = await petService.getPetById(petId, ownerId);
      expect(pet._id).toBe(petId);
      expect(pet.name).toBe('Buddy');
    });

    it('getPetById throws ForbiddenError for unauthorized user', async () => {
      jest.spyOn(petRepository, 'findById').mockResolvedValue(mockPet as any);

      await expect(petService.getPetById(petId, otherUserId)).rejects.toThrow(ForbiddenError);
    });

    it('getPetById throws NotFoundError when pet does not exist', async () => {
      jest.spyOn(petRepository, 'findById').mockResolvedValue(null);

      await expect(petService.getPetById('nonexistent', ownerId)).rejects.toThrow(NotFoundError);
    });

    it('updatePet allows owner to update fields and logs weight_updated event when weight changes', async () => {
      jest.spyOn(petRepository, 'findById').mockResolvedValue(mockPet as any);
      const updatedPet = {
        ...mockPet,
        weight: 16.5,
        toJSON: () => ({ ...mockPet.toJSON(), weight: 16.5 }),
      };
      jest.spyOn(petRepository, 'updateById').mockResolvedValue(updatedPet as any);
      const addEventSpy = jest.spyOn(TimelineService, 'addEvent').mockResolvedValue({} as any);

      const result = await petService.updatePet(petId, ownerId, { weight: 16.5 });

      expect(addEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          petId,
          type: 'weight_updated',
        })
      );
      expect(result.weight).toBe(16.5);
    });

    it('updatePet throws ForbiddenError if non-owner attempts to update', async () => {
      jest.spyOn(petRepository, 'findById').mockResolvedValue(mockPet as any);

      await expect(
        petService.updatePet(petId, otherUserId, { name: 'Hacked' })
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
