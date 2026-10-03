import { Router } from 'express';
import { healthController } from './health.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router: Router = Router({ mergeParams: true });

// All routes are scoped to a pet: /pets/:petId/health/*
// Ensure authentication is required for all health endpoints
router.use(authenticate);

// ─── Dashboard & Analytics ───────────────────────────────────
router.get('/dashboard', healthController.getDashboard);
router.get('/analytics', healthController.getAnalytics);
router.get('/summary', healthController.getSummary);

// ─── Medical Records ─────────────────────────────────────────
router.get('/records', healthController.getVisits);
router.post('/records', healthController.createVisit);
router.get('/records/:recordId', healthController.getVisitById);
router.patch('/records/:recordId', healthController.updateVisit);
router.delete('/records/:recordId', healthController.deleteVisit);

// ─── Vitals ──────────────────────────────────────────────────
router.get('/vitals', healthController.getVitals);
router.post('/vitals', healthController.logVital);
router.get('/vitals/latest', healthController.getLatestVitals);
router.delete('/vitals/:vitalId', healthController.deleteVital);

// ─── Conditions ──────────────────────────────────────────────
router.get('/conditions', healthController.getConditions);
router.post('/conditions', healthController.addCondition);
router.patch('/conditions/:condId', healthController.updateCondition);
router.post('/conditions/:condId/progress', healthController.addProgressNote);
router.delete('/conditions/:condId', healthController.deleteCondition);

// ─── Allergies ───────────────────────────────────────────────
router.get('/allergies', healthController.getAllergies);
router.post('/allergies', healthController.addAllergy);
router.patch('/allergies/:allergyId', healthController.updateAllergy);
router.delete('/allergies/:allergyId', healthController.deleteAllergy);

// Prescriptions endpoints have been moved to the new Medication module.

// ─── Lab Reports ─────────────────────────────────────────────
router.get('/labs', healthController.getLabReports);
router.post('/labs', healthController.createLabReport);
router.get('/labs/:labId', healthController.getLabReportById);
router.patch('/labs/:labId', healthController.updateLabReport);

// ─── Imaging Studies ─────────────────────────────────────────
router.get('/imaging', healthController.getImagingStudies);
router.post('/imaging', healthController.createImagingStudy);
router.get('/imaging/:studyId', healthController.getImagingStudyById);
router.patch('/imaging/:studyId', healthController.updateImagingStudy);

// ─── Surgeries ───────────────────────────────────────────────
router.get('/surgeries', healthController.getSurgeries);
router.post('/surgeries', healthController.createSurgery);
router.patch('/surgeries/:surgeryId', healthController.updateSurgery);
router.delete('/surgeries/:surgeryId', healthController.deleteSurgery);

export { router as healthRoutes };
