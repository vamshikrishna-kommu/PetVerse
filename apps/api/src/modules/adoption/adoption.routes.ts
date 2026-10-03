import { Router } from 'express';
import { adoptionController } from './adoption.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

const createListingSchema = z.object({
  name: z.string().min(2).max(100),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other']),
  breed: z.string().optional(),
  age: z.string().min(1),
  gender: z.enum(['male', 'female', 'unknown']),
  size: z.enum(['small', 'medium', 'large', 'giant']),
  description: z.string().min(10).max(3000),
  photos: z.array(z.string().url()).optional(),
  isVaccinated: z.boolean().optional(),
  isSpayedNeutered: z.boolean().optional(),
  specialNeeds: z.string().optional(),
  location: z.string().min(2),
  shelterName: z.string().optional(),
  shelterContact: z.string().optional(),
});

const submitApplicationSchema = z.object({
  applicantName: z.string().min(2),
  applicantEmail: z.string().email(),
  applicantPhone: z.string().min(6),
  homeType: z.enum(['apartment', 'house_with_yard', 'house_no_yard']),
  hasOtherPets: z.boolean(),
  otherPetsDetails: z.string().optional(),
  experienceDescription: z.string().min(10).max(2000),
});

const updateAppStatusSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

// Public listings
router.get('/listings', adoptionController.getListings);
router.get('/listings/:id', adoptionController.getListingById);

// Authenticated listing management
router.post('/listings', authenticate, validate(createListingSchema), adoptionController.createListing);
router.put('/listings/:id', authenticate, validate(createListingSchema.partial()), adoptionController.updateListing);
router.delete('/listings/:id', authenticate, adoptionController.deleteListing);

// Adoption applications
router.post('/listings/:id/apply', authenticate, validate(submitApplicationSchema), adoptionController.submitApplication);
router.get('/applications/my', authenticate, adoptionController.getMyApplications);
router.get('/listings/:id/applications', authenticate, adoptionController.getListingApplications);
router.patch('/applications/:id/status', authenticate, validate(updateAppStatusSchema), adoptionController.updateApplicationStatus);

export default router;
