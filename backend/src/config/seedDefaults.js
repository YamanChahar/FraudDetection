import { userRepository } from '../repositories/userRepository.js';
import { hashPassword } from '../utils/tokenUtils.js';

/**
 * Seeds default platform users if not already present.
 * Ensures local development & demonstration environments always have functional login credentials.
 */
export async function seedDefaultUsers() {
  try {
    const existingLead = await userRepository.findByEmail('lead@trace.local');
    if (!existingLead) {
      const passwordHash = await hashPassword('Password123!');
      
      await userRepository.create({
        name: 'Security Lead',
        email: 'lead@trace.local',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      });

      await userRepository.create({
        name: 'Senior Investigator',
        email: 'investigator@trace.local',
        passwordHash,
        role: 'INVESTIGATOR',
        isActive: true,
      });

      await userRepository.create({
        name: 'Fraud Analyst',
        email: 'analyst@trace.local',
        passwordHash,
        role: 'ANALYST',
        isActive: true,
      });

      console.log('[TRACE Seed] Default platform accounts created: lead@trace.local, investigator@trace.local, analyst@trace.local (Password123!)');
    }
  } catch (err) {
    console.warn('[TRACE Seed] Default user seeding skipped or failed:', err.message);
  }
}
