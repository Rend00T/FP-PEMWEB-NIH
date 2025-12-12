import { PrismaClient } from '@prisma/client';

import { gameTemplateSeed, quizSeed, userSeed } from './seed';

const prisma = new PrismaClient();

async function main() {
  console.log('⚒️ Seeding for WordIT backend database...');

  try {
    await userSeed(process.env.NODE_ENV === 'production');
    await gameTemplateSeed();
    
    // Quiz seed is optional, continue even if it fails
    try {
      await quizSeed();
    } catch (quizError) {
      console.warn('⚠️  Quiz seed failed (non-critical):', quizError instanceof Error ? quizError.message : quizError);
    }
  } catch (error) {
    console.error('⛔ Seeding error:', error);
    process.exit(1);
  } finally {
    console.log('✅ Seeding success');
    await prisma.$disconnect();
  }
}

main();
