import { growthRepository } from '../repositories/growth.repository';
import { petService } from '../../pets/pet.service';
import { TimelineService } from '../../pets/timeline.service';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';
import type { IGrowthLog } from '@petverse/shared-types';

export const growthService = {
  async addGrowthLog(
    petId: string,
    ownerId: string,
    data: Partial<IGrowthLog>,
    isAdmin = false
  ): Promise<IGrowthLog> {
    await petService.getPetById(petId, ownerId, isAdmin);

    const recordedAt = data.date ? new Date(data.date) : new Date();

    const log = await growthRepository.create({
      petId: petId as any,
      ownerId: ownerId as any,
      recordedAt,
      weight: data.weight,
      height: data.height,
      length: data.length,
      notes: data.notes,
      photo: data.photo,
    } as any);

    // Update weight on master PetModel if weight is specified
    if (data.weight && data.weight > 0) {
      await petService.updatePet(petId, ownerId, { weight: data.weight }, isAdmin);
    }

    // Add Timeline Event
    await TimelineService.addEvent({
      petId,
      type: 'weight_updated',
      title: 'Growth Log Recorded',
      description: `Weight recorded at ${data.weight ?? 'N/A'} kg${data.height ? `, Height ${data.height} cm` : ''}`,
      metadata: { growthId: log._id.toString(), weight: data.weight, height: data.height },
    });

    return log.toJSON() as unknown as IGrowthLog;
  },

  async getGrowthLogs(
    petId: string,
    ownerId: string,
    query: { startDate?: string; endDate?: string; limit?: number } = {},
    isAdmin = false
  ): Promise<IGrowthLog[]> {
    await petService.getPetById(petId, ownerId, isAdmin);
    const logs = await growthRepository.findByPet(petId, query);
    return logs.map((l) => l.toJSON() as unknown as IGrowthLog);
  },

  async getGrowthAnalytics(petId: string, ownerId: string, isAdmin = false) {
    await petService.getPetById(petId, ownerId, isAdmin);
    const logs = await growthRepository.findByPet(petId, { limit: 100 });

    if (logs.length === 0) {
      return {
        currentWeight: 0,
        previousWeight: 0,
        weightChange: 0,
        percentageChange: 0,
        currentHeight: 0,
        measurementCount: 0,
        lastMeasurementDate: null,
      };
    }

    const sortedAsc = [...logs].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    const latest = sortedAsc[sortedAsc.length - 1];
    const previous = sortedAsc.length > 1 ? sortedAsc[sortedAsc.length - 2] : null;

    const currentWeight = latest.weight || 0;
    const previousWeight = previous?.weight || currentWeight;
    const weightChange = Number((currentWeight - previousWeight).toFixed(2));
    const percentageChange =
      previousWeight > 0 ? Number(((weightChange / previousWeight) * 100).toFixed(1)) : 0;

    return {
      currentWeight,
      previousWeight,
      weightChange,
      percentageChange,
      currentHeight: latest.height || 0,
      measurementCount: logs.length,
      lastMeasurementDate: latest.recordedAt.toISOString(),
    };
  },

  async updateGrowthLog(
    petId: string,
    growthId: string,
    ownerId: string,
    data: Partial<IGrowthLog>,
    isAdmin = false
  ): Promise<IGrowthLog> {
    await petService.getPetById(petId, ownerId, isAdmin);
    const existing = await growthRepository.findById(growthId);
    if (!existing || existing.petId.toString() !== petId) {
      throw new NotFoundError('Growth Log');
    }

    const updated = await growthRepository.updateById(growthId, data as any);
    if (!updated) throw new NotFoundError('Growth Log');

    if (data.weight && data.weight > 0) {
      await petService.updatePet(petId, ownerId, { weight: data.weight }, isAdmin);
    }

    return updated.toJSON() as unknown as IGrowthLog;
  },

  async deleteGrowthLog(
    petId: string,
    growthId: string,
    ownerId: string,
    isAdmin = false
  ): Promise<void> {
    await petService.getPetById(petId, ownerId, isAdmin);
    const existing = await growthRepository.findById(growthId);
    if (!existing || existing.petId.toString() !== petId) {
      throw new NotFoundError('Growth Log');
    }

    await growthRepository.deleteById(growthId);
  },
};
