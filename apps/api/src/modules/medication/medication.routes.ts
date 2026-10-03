import { Router } from 'express';
import { medicationController } from './controllers/medication.controller';
import { prescriptionController } from './controllers/prescription.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router: Router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// ─── Formulary ────────────────────────────────────────────────
router.get('/categories', medicationController.getCategories);
router.post('/categories', medicationController.createCategory);

router.get('/directory', medicationController.getMedications);
router.get('/directory/search', medicationController.searchMedications);
router.get('/directory/:id', medicationController.getMedicationById);
router.post('/directory', medicationController.createMedication);

// ─── Prescriptions (Requires PetId context if desired, or can be mounted generally)
router.get('/pets/:petId/prescriptions', prescriptionController.getPrescriptionsByPet);
router.post('/pets/:petId/prescriptions', prescriptionController.createPrescription);

// ─── Courses & Compliance
router.get('/pets/:petId/courses', prescriptionController.getCoursesByPet);
router.get('/pets/:petId/courses/:courseId/compliance', prescriptionController.getComplianceDetails);

// ─── Administration & Side Effects
router.get('/pets/:petId/courses/:courseId/administrations', prescriptionController.getAdministrationsByCourse);
router.post('/pets/:petId/courses/:courseId/administrations', prescriptionController.logAdministration);
router.post('/pets/:petId/side-effects', prescriptionController.reportSideEffect);
router.get('/pets/:petId/side-effects', prescriptionController.getSideEffectsByPet);

export { router as medicationRoutes };
