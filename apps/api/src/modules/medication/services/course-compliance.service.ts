import { courseRepository, complianceRepository } from '../repositories';
import { TimelineService } from '../../pets/timeline.service';

export class CourseComplianceService {
  /**
   * Recalculates compliance for a specific course based on administered doses.
   */
  async updateCompliance(courseId: string, petId: string, action: 'completed' | 'missed' | 'late' | 'skipped') {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new Error('Course not found');

    let { dosesCompleted, dosesMissed, totalDosesExpected } = course;

    if (action === 'completed') dosesCompleted++;
    if (action === 'missed' || action === 'skipped') dosesMissed++;

    const completionPercentage = totalDosesExpected > 0 
      ? Math.min(100, Math.round((dosesCompleted / totalDosesExpected) * 100))
      : 0;

    // 1. Update Course State
    await courseRepository.updateById(courseId, {
      $set: { dosesCompleted, dosesMissed, completionPercentage },
    });

    // 2. If completed, emit Timeline event
    if (completionPercentage >= 100 && course.status !== 'completed') {
      await courseRepository.updateById(courseId, { $set: { status: 'completed', completedAt: new Date() } });
      await TimelineService.addEvent({
        petId,
        type: 'course_completed' as any, // TimelineEvent mapping later
        title: 'Medication Course Completed',
        description: `Course ${courseId} has been successfully completed.`,
        metadata: { courseId }
      });
    }

    // 3. Update Compliance Engine stats
    const compliance = await complianceRepository.findByPetAndCourse(petId, courseId);
    const currentStreak = action === 'completed' ? (compliance?.currentStreak || 0) + 1 : 0;
    const longestStreak = Math.max(currentStreak, compliance?.longestStreak || 0);
    const adherenceScore = totalDosesExpected > 0 
      ? Math.round((dosesCompleted / (dosesCompleted + dosesMissed)) * 100) 
      : 100;

    await complianceRepository.upsert(petId, courseId, {
      completedDoses: dosesCompleted,
      missedDoses: dosesMissed,
      lateDoses: action === 'late' ? (compliance?.lateDoses || 0) + 1 : (compliance?.lateDoses || 0),
      currentStreak,
      longestStreak,
      adherenceScore,
      lastCalculatedAt: new Date()
    });

    return adherenceScore;
  }
}

export const courseComplianceService = new CourseComplianceService();
