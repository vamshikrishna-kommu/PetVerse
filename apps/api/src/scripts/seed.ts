import mongoose from 'mongoose';
import { env } from '../config/env';
import { nearbyService } from '../modules/nearby/services/nearby.service';
import { marketplaceService } from '../modules/marketplace/marketplace.service';
import { adoptionService } from '../modules/adoption/adoption.service';
import { logger } from '../shared/utils/logger';

async function seedDatabase() {
  logger.info('[Seed] Connecting to MongoDB...', { uri: env.MONGODB_URI });
  await mongoose.connect(env.MONGODB_URI);

  logger.info('[Seed] Seeding verified clinics and hospitals...');
  await nearbyService.seedClinicsIfEmpty();

  logger.info('[Seed] Ensuring marketplace items...');
  await marketplaceService.listProducts({});

  logger.info('[Seed] Ensuring adoption listings...');
  await adoptionService.getListings({});

  logger.info('[Seed] Database initialization complete!');
  await mongoose.disconnect();
}

seedDatabase()
  .then(() => {
    logger.info('Database seeded successfully.');
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Failed to seed database:', { error: err.message });
    process.exit(1);
  });
