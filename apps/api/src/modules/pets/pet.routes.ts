import { Router } from 'express';
import { z } from 'zod';
import { petController } from './pet.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { healthRoutes } from '../health/health.routes';
import growthRoutes from '../growth/growth.routes';
import { uploadAvatar, uploadGalleryImages } from '../../middlewares/upload.middleware';

const router: Router = Router();

const createPetSchema = z.object({
  name: z.string().min(1).max(50),
  nickname: z.string().max(50).optional(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other']),
  breed: z.string().max(100).optional(),
  subBreed: z.string().max(100).optional(),
  dob: z.string().datetime().optional(),
  estimatedAge: z.string().optional(),
  gender: z.enum(['male', 'female', 'unknown']).default('unknown'),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  color: z.string().max(50).optional(),
  bloodGroup: z.string().max(20).optional(),
  
  microchipId: z.string().optional(),
  registrationNumber: z.string().optional(),
  passportNumber: z.string().optional(),

  allergies: z.array(z.string()).optional(),
  chronicDiseases: z.array(z.string()).optional(),
  disabilities: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
  isVaccinated: z.boolean().default(false),
  isSterilized: z.boolean().default(false),

  lifestyle: z.enum(['indoor', 'outdoor', 'mixed']).default('indoor'),
  activityLevel: z.enum(['low', 'moderate', 'high']).default('moderate'),
  favoriteFood: z.array(z.string()).optional(),
  favoriteToys: z.array(z.string()).optional(),
  behaviorNotes: z.string().max(1000).optional(),

  adoptionDate: z.string().datetime().optional(),
  shelterName: z.string().max(100).optional(),
  insuranceProvider: z.string().max(100).optional(),
  insuranceExpiry: z.string().datetime().optional(),

  gallery: z.array(z.string()).optional(),
  isAdopted: z.boolean().optional(),
  isLost: z.boolean().optional(),
  isPublicProfile: z.boolean().default(true),
});

const updatePetSchema = createPetSchema.partial();

// All pet routes require authentication
router.use(authenticate);

router.get('/',       petController.getPets);
router.get('/lost',   petController.getLostPets);
router.post('/',      validate(createPetSchema),  petController.createPet);
router.get('/:id',    petController.getPetById);
router.patch('/:id',  validate(updatePetSchema),  petController.updatePet);
router.delete('/:id', petController.deletePet);
router.get('/:id/timeline', petController.getPetTimeline);

// Avatar upload — multipart/form-data with field name 'avatar'
router.post('/:id/avatar', uploadAvatar, petController.uploadAvatar);

// Pet Gallery — multi-image upload, image removal, primary avatar selection
router.post('/:id/gallery', uploadGalleryImages, petController.uploadGallery);
router.delete('/:id/gallery', petController.removeGalleryImage);
router.patch('/:id/gallery/primary', petController.setPrimaryGalleryImage);

// Nest health & growth sub-routes
router.use('/:petId/health', healthRoutes);
router.use('/:petId/growth', growthRoutes);

export default router;
