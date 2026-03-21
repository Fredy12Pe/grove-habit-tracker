/**
 * Shared island world geometry + assets for the main game and Garden tab preview.
 * Must stay in sync with rendering in app/(tabs)/game.tsx.
 */

import { getGardenFloorRect } from "@/lib/game/gardenBackupGrid";

export function getIslandWorldLayout(windowHeight: number) {
  const BG_ASPECT = 2213 / 1000;
  const WORLD_H = windowHeight;
  const WORLD_W = Math.round(windowHeight * BG_ASPECT);

  const BG = require("@/assets/game-backup/background/Background.png");
  const ISLAND = require("@/assets/game-backup/island/island-main.png");
  const WALK_AREA = require("@/assets/game-backup/island/unified-walkArea.png");

  const ISLAND_W = Math.round(1751 * (WORLD_H / 1000));
  const ISLAND_H = Math.round(705 * (WORLD_H / 1000));
  const ISLAND_LEFT = (WORLD_W - ISLAND_W) / 2;
  const ISLAND_TOP = (WORLD_H - ISLAND_H) / 2 - WORLD_H * 0.102;

  const TREE_FALL_FRAMES = [
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-01.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-02.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-03.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-04.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-05.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-06.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-07.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-08.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-09.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-10.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-11.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-12.png"),
    require("@/assets/game-backup/Sprites/Tree_falling/Tree_falling-13.png"),
  ] as const;
  const TREE_FALL_FRAME_COUNT = TREE_FALL_FRAMES.length;
  const TREE_DISPLAY_H = Math.round(ISLAND_H * 0.22);
  const TREE_DISPLAY_W = Math.round(ISLAND_W * 0.1);
  const TREE_WORLD_X = ISLAND_LEFT + ISLAND_W * 0.9;
  const TREE_WORLD_Y = ISLAND_TOP + ISLAND_H * 0.44;
  const TREE_INTERACT_RADIUS = Math.max(
    56,
    Math.min(TREE_DISPLAY_W, TREE_DISPLAY_H) * 0.9,
  );
  const TREE_DEPTH_Y = TREE_WORLD_Y;
  const TREE_TRUNK_HALF_W = Math.max(14, Math.round(TREE_DISPLAY_W * 0.22));
  const TREE_TRUNK_TOP = TREE_WORLD_Y - Math.round(TREE_DISPLAY_H * 0.38);

  const HILLS = require("@/assets/game-backup/hills/hills.png");
  const HILLS_SCALE = ISLAND_W / 1751;
  const HILLS_W = Math.round(417 * HILLS_SCALE);
  const HILLS_H = Math.round(219 * HILLS_SCALE);
  const HILLS_LEFT = ISLAND_LEFT + ISLAND_W * 0.34 - HILLS_W / 2;
  const HILLS_TOP = ISLAND_TOP + ISLAND_H * 0.14 - HILLS_H / 2;

  const HILLS_BTM1 = require("@/assets/game-backup/hills/Hills-bottom-1.png");
  const HILLS_BTM2 = require("@/assets/game-backup/hills/Hills-bottom-2.png");
  const HBTM1_W = Math.round(172 * HILLS_SCALE);
  const HBTM1_H = Math.round(30 * HILLS_SCALE);
  const HBTM2_W = Math.round(128 * HILLS_SCALE);
  const HBTM2_H = Math.round(29 * HILLS_SCALE);

  const HBTM1_LEFT = HILLS_LEFT + HILLS_W * -0.0;
  const HBTM1_TOP = HILLS_TOP + HILLS_H - HBTM1_H * 2.5;
  const HBTM2_LEFT = HILLS_LEFT + HILLS_W * 0.694;
  const HBTM2_TOP = HILLS_TOP + HILLS_H - HBTM2_H * 2.2;

  const ARROW_X = HILLS_LEFT + HILLS_W * 0.84;
  const ARROW_Y = HILLS_TOP + HILLS_H * 0.75;
  const ARROW_SIZE = Math.round(HILLS_W * 0.08);

  const HOUSE_FRAME = require("@/assets/game-backup/house/house-frame.png");
  const HOUSE_FLOOR = require("@/assets/game-backup/house/house-floor.png");
  const HOUSE_BED = require("@/assets/game-backup/house/house-bed.png");
  const HOUSE_DRAWER = require("@/assets/game-backup/house/house-drawer.png");
  const HOUSE_IMAGE = require("@/assets/game-backup/house/house-image.png");
  const HOUSE_DESK = require("@/assets/game-backup/house/desk-and-table.png");

  const FRAME_NW = 233;
  const FRAME_NH = 194;
  const FLOOR_NW = 207;

  const HOUSE_SCALE = HILLS_SCALE * 1.2;
  const HOUSE_W = Math.round(FRAME_NW * HOUSE_SCALE);
  const HOUSE_H = Math.round(FRAME_NH * HOUSE_SCALE);

  const HOUSE_LEFT = HILLS_LEFT - HILLS_W * 0.48;
  const HOUSE_TOP = HILLS_TOP + HOUSE_H * 1;

  const INTERIOR_X = Math.round(13 * HOUSE_SCALE);
  const INTERIOR_Y = Math.round(18 * HOUSE_SCALE);
  const INTERIOR_W = Math.round(FLOOR_NW * HOUSE_SCALE);
  const INTERIOR_H = Math.round(155 * HOUSE_SCALE);

  const HIMG_X = Math.round(35 * HOUSE_SCALE);
  const HIMG_Y = Math.round(28 * HOUSE_SCALE);
  const HIMG_W = Math.round(29 * HOUSE_SCALE);
  const HIMG_H = Math.round(19 * HOUSE_SCALE);

  const HDRAWER_X = Math.round(160 * HOUSE_SCALE);
  const HDRAWER_Y = Math.round(12 * HOUSE_SCALE);
  const HDRAWER_W = Math.round(37 * HOUSE_SCALE);
  const HDRAWER_H = Math.round(42 * HOUSE_SCALE);

  const HBED_X = Math.round(172 * HOUSE_SCALE);
  const HBED_Y = Math.round(50 * HOUSE_SCALE);
  const HBED_W = Math.round(37 * HOUSE_SCALE);
  const HBED_H = Math.round(53 * HOUSE_SCALE);

  const HDESK_X = Math.round(18 * HOUSE_SCALE);
  const HDESK_Y = Math.round(85 * HOUSE_SCALE);
  const HDESK_W = Math.round(74 * HOUSE_SCALE);
  const HDESK_H = Math.round(37 * HOUSE_SCALE);

  const HOUSE_DOOR_X = HOUSE_LEFT + HOUSE_W * 0.2;
  const HOUSE_DOOR_Y = HOUSE_TOP + HOUSE_H - 2;
  const HOUSE_DOOR_RADIUS = 18;
  const HOUSE_EXIT_X = HOUSE_LEFT + INTERIOR_X + INTERIOR_W * 0.1;
  const HOUSE_EXIT_Y = HOUSE_TOP + INTERIOR_Y + INTERIOR_H - 40;
  const HOUSE_EXIT_RADIUS = 22;
  const HOUSE_ENTER_POS = {
    x: HOUSE_LEFT + INTERIOR_X + INTERIOR_W / 2,
    y: HOUSE_TOP + INTERIOR_Y + INTERIOR_H / 2,
  };
  const HOUSE_INTERIOR_RECT = {
    left: HOUSE_LEFT + INTERIOR_X + 4,
    top: HOUSE_TOP + INTERIOR_Y + 4,
    right: HOUSE_LEFT + INTERIOR_X + INTERIOR_W - 4,
    bottom: HOUSE_TOP + INTERIOR_Y + INTERIOR_H - 4,
  };

  const GARDEN_FLOOR = require("@/assets/game-backup/garden/garden-floor.png");
  const GARDEN_BACK = require("@/assets/game-backup/garden/Back.png");
  const GARDEN_SIDES = require("@/assets/game-backup/garden/garden-sides.png");
  const GARDEN_FRONTS = [
    require("@/assets/game-backup/garden/Front-1.png"),
    require("@/assets/game-backup/garden/Front-2.png"),
    require("@/assets/game-backup/garden/Front-3.png"),
    require("@/assets/game-backup/garden/Front-4.png"),
  ];

  const G_CONTAINER_W = 144;
  const G_CONTAINER_H = 111;
  const G_FLOOR = { w: 125, h: 83 };
  const G_BACK = { w: 143, h: 30 };
  const G_SIDES = { w: 142, h: 111 };
  const G_FRONT = { w: 144, h: 30 };

  const GARDEN_SCALE = (ISLAND_W * 0.086) / G_CONTAINER_W;
  const GW = Math.round(G_CONTAINER_W * GARDEN_SCALE);
  const GH = Math.round(G_CONTAINER_H * GARDEN_SCALE);

  const G_CENTER_X = 0.51;
  const G_CENTER_Y = 0.58;
  const G_GAP_X = 0.06;
  const G_GAP_Y = 0.12;
  const GARDEN_POSITIONS = [
    { x: G_CENTER_X - G_GAP_X, y: G_CENTER_Y - G_GAP_Y },
    { x: G_CENTER_X + G_GAP_X, y: G_CENTER_Y - G_GAP_Y },
    { x: G_CENTER_X - G_GAP_X, y: G_CENTER_Y + G_GAP_Y },
    { x: G_CENTER_X + G_GAP_X, y: G_CENTER_Y + G_GAP_Y },
  ];

  const BACKUP_GARDEN_FLOOR_RECT = getGardenFloorRect(GW, GH);

  const START_X = WORLD_W / 2 + 20;
  const START_Y = WORLD_H / 2 - 50;

  return {
    BG_ASPECT,
    WORLD_H,
    WORLD_W,
    BG,
    ISLAND,
    WALK_AREA,
    ISLAND_W,
    ISLAND_H,
    ISLAND_LEFT,
    ISLAND_TOP,
    TREE_FALL_FRAMES,
    TREE_FALL_FRAME_COUNT,
    TREE_DISPLAY_H,
    TREE_DISPLAY_W,
    TREE_WORLD_X,
    TREE_WORLD_Y,
    TREE_INTERACT_RADIUS,
    TREE_DEPTH_Y,
    TREE_TRUNK_HALF_W,
    TREE_TRUNK_TOP,
    HILLS,
    HILLS_SCALE,
    HILLS_W,
    HILLS_H,
    HILLS_LEFT,
    HILLS_TOP,
    HILLS_BTM1,
    HILLS_BTM2,
    HBTM1_W,
    HBTM1_H,
    HBTM2_W,
    HBTM2_H,
    HBTM1_LEFT,
    HBTM1_TOP,
    HBTM2_LEFT,
    HBTM2_TOP,
    ARROW_X,
    ARROW_Y,
    ARROW_SIZE,
    HOUSE_FRAME,
    HOUSE_FLOOR,
    HOUSE_BED,
    HOUSE_DRAWER,
    HOUSE_IMAGE,
    HOUSE_DESK,
    HOUSE_W,
    HOUSE_H,
    HOUSE_LEFT,
    HOUSE_TOP,
    INTERIOR_X,
    INTERIOR_Y,
    INTERIOR_W,
    INTERIOR_H,
    HIMG_X,
    HIMG_Y,
    HIMG_W,
    HIMG_H,
    HDRAWER_X,
    HDRAWER_Y,
    HDRAWER_W,
    HDRAWER_H,
    HBED_X,
    HBED_Y,
    HBED_W,
    HBED_H,
    HDESK_X,
    HDESK_Y,
    HDESK_W,
    HDESK_H,
    HOUSE_DOOR_X,
    HOUSE_DOOR_Y,
    HOUSE_DOOR_RADIUS,
    HOUSE_EXIT_X,
    HOUSE_EXIT_Y,
    HOUSE_EXIT_RADIUS,
    HOUSE_ENTER_POS,
    HOUSE_INTERIOR_RECT,
    GARDEN_FLOOR,
    GARDEN_BACK,
    GARDEN_SIDES,
    GARDEN_FRONTS,
    G_CONTAINER_W,
    G_CONTAINER_H,
    G_FLOOR,
    G_BACK,
    G_SIDES,
    G_FRONT,
    GARDEN_SCALE,
    GW,
    GH,
    G_CENTER_X,
    G_CENTER_Y,
    G_GAP_X,
    G_GAP_Y,
    GARDEN_POSITIONS,
    BACKUP_GARDEN_FLOOR_RECT,
    START_X,
    START_Y,
  };
}

export type IslandWorldLayout = ReturnType<typeof getIslandWorldLayout>;
