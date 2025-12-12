import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { PrismaClient, type ROLE } from '@prisma/client';
import bcrypt from 'bcryptjs';
import csv from 'csvtojson';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface IUsers {
  id: string;
  username: string;
  email: string;
  password: string;
  role: ROLE;
}

export const userSeed = async (is_production?: boolean) => {
  try {
    console.log('🌱 Seed users');

    const datas: IUsers[] = await csv().fromFile(
      path.resolve(
        __dirname,
        '../data/' + (is_production ? 'users-prod.data.csv' : 'users.data.csv'),
      ),
    );

    for (const data of datas) {
      const hashedPassword = await bcrypt.hash(data.password, 10);

      const profilePicturePath = path.resolve(
        __dirname,
        '../data/images/default_image.jpg',
      );

      const destPath = `uploads/profile-picture/user-${data.id}${path.extname('default_image.jpg')}`;

      // Copy file
      fs.copyFileSync(profilePicturePath, destPath);

      await prisma.users.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          email: data.email,
          username: data.username,
          password: hashedPassword,
          profile_picture: profilePicturePath,
          role: data.role,
        },
        update: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          profile_picture: profilePicturePath,
          role: data.role,
        },
      });
    }
  } catch (error) {
    console.log(`❌ Error in users. ${error}`);

    throw error;
  }
};
