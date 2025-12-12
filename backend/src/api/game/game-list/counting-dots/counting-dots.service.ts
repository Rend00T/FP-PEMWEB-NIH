import { type Prisma, type ROLE } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { v4 } from 'uuid';

import { ErrorResponse, prisma } from '@/common';
import { type ICountingDotsGameData } from '@/common/interface/games';
import { FileManager } from '@/utils';

import { type ICreateCountingDots, type IUpdateCountingDots } from './schema';

export abstract class CountingDotsService {
  private static GAME_SLUG = 'counting-dots';

  static async createGame(data: ICreateCountingDots, user_id: string) {
    await this.existGameCheck(data.name);

    const newGameId = v4();
    const gameTemplateId = await this.getGameTemplateId();

    const thumbnailImagePath = await FileManager.upload(
      `game/counting-dots/${newGameId}`,
      data.thumbnail_image,
    );

    const gameJson: ICountingDotsGameData = {
      max_value: data.max_value,
      levels: data.levels,
    };

    const newGame = await prisma.games.create({
      data: {
        id: newGameId,
        game_template_id: gameTemplateId,
        creator_id: user_id,
        name: data.name,
        description: data.description,
        thumbnail_image: thumbnailImagePath,
        is_published: data.is_publish_immediately,
        game_json: gameJson as unknown as Prisma.InputJsonValue,
      },
      select: {
        id: true,
      },
    });

    return newGame;
  }

  static async getGameDetail(
    game_id: string,
    user_id: string,
    user_role: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        created_at: true,
        game_json: true,
        creator_id: true,
        total_played: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (!game || game.game_template.slug !== this.GAME_SLUG)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot access this game',
      );

    return {
      ...game,
      creator_id: undefined,
      game_template: undefined,
    };
  }

  static async getGamePlay(
    game_id: string,
    is_public: boolean,
    user_id?: string,
    user_role?: ROLE,
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
        game_json: true,
        creator_id: true,
        game_template: {
          select: { slug: true },
        },
      },
    });

    if (
      !game ||
      (is_public && !game.is_published) ||
      game.game_template.slug !== this.GAME_SLUG
    )
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (
      !is_public &&
      user_role !== 'SUPER_ADMIN' &&
      game.creator_id !== user_id
    )
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot get this game data',
      );

    const gameJson = game.game_json as unknown as ICountingDotsGameData | null;

    if (!gameJson)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game data not found');

    return {
      id: game.id,
      name: game.name,
      description: game.description,
      thumbnail_image: game.thumbnail_image,
      max_value: gameJson.max_value,
      levels: gameJson.levels,
      is_published: game.is_published,
    };
  }

  static async updateGame(
    game_id: string,
    data: IUpdateCountingDots,
    user: { user_id: string; role: ROLE },
  ) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        creator_id: true,
        thumbnail_image: true,
        game_json: true,
      },
    });

    if (!game) throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user.role !== 'SUPER_ADMIN' && game.creator_id !== user.user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot update this game',
      );

    const updateData: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      is_published: data.is_publish_immediately,
    };

    if (data.thumbnail_image) {
      if (game.thumbnail_image) {
        await FileManager.remove(game.thumbnail_image);
      }
      updateData.thumbnail_image = await FileManager.upload(
        `game/counting-dots/${game_id}`,
        data.thumbnail_image,
      );
    }

    if (data.max_value || data.levels) {
      const gameJson = game.game_json as unknown as ICountingDotsGameData | null;
      const updatedJson: ICountingDotsGameData = {
        max_value: data.max_value ?? gameJson?.max_value ?? 10,
        levels: data.levels ?? gameJson?.levels ?? 5,
      };
      updateData.game_json = updatedJson as unknown as Prisma.InputJsonValue;
    }

    const updatedGame = await prisma.games.update({
      where: { id: game_id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        thumbnail_image: true,
        is_published: true,
      },
    });

    return updatedGame;
  }

  static async deleteGame(game_id: string, user_id: string, user_role: ROLE) {
    const game = await prisma.games.findUnique({
      where: { id: game_id },
      select: {
        id: true,
        thumbnail_image: true,
        creator_id: true,
      },
    });

    if (!game) throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game not found');

    if (user_role !== 'SUPER_ADMIN' && game.creator_id !== user_id)
      throw new ErrorResponse(
        StatusCodes.FORBIDDEN,
        'User cannot delete this game',
      );

    if (game.thumbnail_image) {
      await FileManager.remove(game.thumbnail_image);
    }

    await prisma.games.delete({ where: { id: game_id } });

    return { id: game_id };
  }

  private static async existGameCheck(game_name?: string, game_id?: string) {
    const where: Record<string, unknown> = {};
    if (game_name) where.name = game_name;
    if (game_id) where.id = game_id;

    if (Object.keys(where).length === 0) return null;

    const game = await prisma.games.findFirst({
      where,
      select: { id: true, creator_id: true },
    });

    if (game)
      throw new ErrorResponse(
        StatusCodes.BAD_REQUEST,
        'Game name is already exist',
      );

    return game;
  }

  private static async getGameTemplateId() {
    const result = await prisma.gameTemplates.findUnique({
      where: { slug: this.GAME_SLUG },
      select: { id: true },
    });

    if (!result)
      throw new ErrorResponse(StatusCodes.NOT_FOUND, 'Game template not found');

    return result.id;
  }
}