import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { type Prisma, PrismaClient } from '@prisma/client';
import csv from 'csvtojson';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

interface IQuizCsv {
  id: string;
  game_template_id: string;
  creator_id: string;
  name: string;
  description: string;
  thumbnail_image: string;
  is_publish_immediately: string;
  is_question_randomized: string;
  is_answer_randomized: string;
  score_per_question: string;
}

interface IQuizQuestionCsv {
  game_id: string;
  question_text: string;
  question_image?: string | undefined;
}

interface IQuizAnswerCsv {
  game_id: string;
  question_index: string;
  answer_text: string;
  is_correct: string;
}

interface IQuizJson<T = IQuizAnswer> {
  score_per_question: number;
  is_question_randomized: boolean;
  is_answer_randomized: boolean;
  questions: IQuizQuestion<T>[];
}

interface IQuizQuestion<T> {
  question_text: string;
  question_image: string | null;
  answers: T[];
}

interface IQuizAnswer {
  answer_text: string;
  is_correct: boolean;
}

export const quizSeed = async () => {
  try {
    console.log('🌱 Seed quiz game');

    const datas: IQuizCsv[] = await csv().fromFile(
      path.resolve(__dirname, '../data/quiz-games.data.csv'),
    );

    const questionDatas: IQuizQuestionCsv[] = await csv().fromFile(
      path.resolve(__dirname, '../data/quiz-questions.data.csv'),
    );

    const answerDatas: IQuizAnswerCsv[] = await csv().fromFile(
      path.resolve(__dirname, '../data/quiz-answers.data.csv'),
    );

    for (const data of datas) {
      const questionList = questionDatas.filter(
        question => question.game_id === data.id,
      );
      const answerList = answerDatas.filter(
        answer => answer.game_id === data.id,
      );

      const thumbnailPath = await uploadImage(
        data.id,
        data.thumbnail_image,
        'thumbnail',
      );

      const gameJson: IQuizJson = {
        score_per_question: Number.parseInt(data.score_per_question),
        is_question_randomized: data.is_question_randomized === 'true',
        is_answer_randomized: data.is_answer_randomized === 'true',
        questions: await Promise.all(
          questionList.map(async (question, index) => {
            let imagePath: string | null = null;

            if (question.question_image) {
              imagePath = await uploadImage(
                data.id,
                question.question_image,
                `question-${index}`,
              );
            }

            return {
              question_text: question.question_text,
              question_image: imagePath,
              answers: answerList
                .filter(
                  answer => Number.parseInt(answer.question_index) === index,
                )
                .map(answer => ({
                  answer_text: answer.answer_text,
                  is_correct: answer.is_correct === 'true',
                })),
            };
          }),
        ),
      };

      await prisma.games.upsert({
        where: { id: data.id },
        create: {
          id: data.id,
          name: data.name,
          description: data.description,
          game_template_id: data.game_template_id,
          creator_id: data.creator_id,
          thumbnail_image: thumbnailPath,
          is_published: data.is_publish_immediately === 'true',
          game_json: gameJson as unknown as Prisma.InputJsonValue,
        },
        update: {
          name: data.name,
          description: data.description,
          game_template_id: data.game_template_id,
          creator_id: data.creator_id,
          thumbnail_image: thumbnailPath,
          is_published: data.is_publish_immediately === 'true',
          game_json: gameJson as unknown as Prisma.InputJsonValue,
        },
      });
    }
  } catch (error) {
    console.log(`❌ Error in quiz game. ${error}`);

    throw error;
  }
};

async function uploadImage(
  quiz_id: string,
  image_name: string,
  image_type: string,
) {
  const sourcePath = path.resolve(__dirname, '../data/images/', image_name);
  const picturePath = `uploads/game/quiz/${quiz_id}/${image_type}${path.extname(image_name)}`;

  // Ensure directory exists
  const dir = path.dirname(picturePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.copyFileSync(sourcePath, picturePath);

  return picturePath;
}
