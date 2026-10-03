import { Router } from 'express';
import { vaccinationController } from './vaccination.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Definitions (Global, doesn't need pet ownership but auth is fine)
router.get('/definitions', vaccinationController.getDefinitions);
router.post('/definitions', vaccinationController.createDefinition); // Typically admin-only

// Apply Pet Ownership protection for all pet-specific routes
// router.use('/:petId', assertPetOwnership);

// Schedule & Analytics
router.get('/:petId/schedule', vaccinationController.getSchedule);
router.get('/:petId/analytics', vaccinationController.getAnalytics);

// Records
router.get('/:petId/records', vaccinationController.getRecords);
router.post('/:petId/records', vaccinationController.recordVaccination);
router.delete('/:petId/records/:recordId', vaccinationController.deleteRecord);

// Reactions
router.get('/:petId/reactions', vaccinationController.getReactions);
router.post('/:petId/reactions', vaccinationController.recordReaction);

// Certificates
router.get('/:petId/certificates', vaccinationController.getCertificates);
router.post('/:petId/certificates', vaccinationController.createCertificate);

export const vaccinationRoutes: Router = router;
