-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "profile_picture" TEXT,
    "total_game_played" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GameTemplates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logo" TEXT,
    "is_time_limit_based" BOOLEAN NOT NULL DEFAULT false,
    "is_life_based" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail_image" TEXT NOT NULL,
    "game_template_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "game_json" JSONB NOT NULL,
    "total_played" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Games_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Games_game_template_id_fkey" FOREIGN KEY ("game_template_id") REFERENCES "GameTemplates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LikedGames" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LikedGames_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LikedGames_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Leaderboard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "game_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "difficulty" TEXT,
    "time_taken" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Leaderboard_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Leaderboard_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GameTemplates_slug_key" ON "GameTemplates"("slug");

-- CreateIndex
CREATE INDEX "GameTemplates_slug_name_idx" ON "GameTemplates"("slug", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Games_name_key" ON "Games"("name");

-- CreateIndex
CREATE INDEX "Games_name_idx" ON "Games"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LikedGames_user_id_game_id_key" ON "LikedGames"("user_id", "game_id");

-- CreateIndex
CREATE INDEX "Leaderboard_game_id_score_idx" ON "Leaderboard"("game_id", "score");

-- CreateIndex
CREATE INDEX "Leaderboard_user_id_idx" ON "Leaderboard"("user_id");
