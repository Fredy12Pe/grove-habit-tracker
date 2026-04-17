/**
 * Shared island world geometry + assets for the main game and Garden tab preview.
 * Must stay in sync with rendering in app/(tabs)/game.tsx.
 */

import { getGardenFloorRect } from "@/lib/game/gardenBackupGrid";

export function getIslandWorldLayout(windowHeight: number) {
  const BG_ASPECT = 2213 / 1000;
  const WORLD_H = windowHeight;
  const WORLD_W = Math.round(windowHeight * BG_ASPECT);

  const BG = require("@/assets/Game/background/Background.png");
  const ISLAND = require("@/assets/Game/island/island-main.png");
  const WALK_AREA = require("@/assets/Game/island/unified-walkArea.png");

  const ISLAND_W = Math.round(1751 * (WORLD_H / 1000));
  const ISLAND_H = Math.round(705 * (WORLD_H / 1000));
  const ISLAND_LEFT = (WORLD_W - ISLAND_W) / 2;
  const ISLAND_TOP = (WORLD_H - ISLAND_H) / 2 - WORLD_H * 0.102;

  const TREE_FALL_FRAMES = [
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-01.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-02.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-03.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-04.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-05.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-06.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-07.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-08.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-09.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-10.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-11.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-12.png"),
    require("@/assets/Game/Sprites/Tree_falling/Tree_falling-13.png"),
  ] as const;
  const TREE_FALL_FRAME_COUNT = TREE_FALL_FRAMES.length;
  const TREE_DISPLAY_H = Math.round(ISLAND_H * 0.23);
  const TREE_DISPLAY_W = Math.round(ISLAND_W * 0.11);
  /** Horizontal anchor (0 = left edge of island art, 1 = right). Left side of the playable island. */
  const TREE_WORLD_X = ISLAND_LEFT + ISLAND_W * 0.16;
  const TREE_WORLD_Y = ISLAND_TOP + ISLAND_H * 0.26;
  const TREE_DEPTH_Y = TREE_WORLD_Y;
  const TREE_TRUNK_HALF_W = Math.max(14, Math.round(TREE_DISPLAY_W * 0.22));
  const TREE_TRUNK_TOP = TREE_WORLD_Y - Math.round(TREE_DISPLAY_H * 0.38);
  /** "Chop" proximity: centered on tree sprite, tighter radius. */
  const TREE_INTERACT_CENTER_X = TREE_WORLD_X;
  const TREE_INTERACT_CENTER_Y = TREE_WORLD_Y - Math.round(TREE_DISPLAY_H / 2);
  const TREE_INTERACT_RADIUS = Math.max(
    36,
    Math.round(Math.min(TREE_DISPLAY_W, TREE_DISPLAY_H) * 0.52),
  );

  const COW_EATING_FRAMES = [
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_1.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_2.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_3.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_4.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_5.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_6.png"),
    require("@/assets/Game/Sprites/cow-animation/cow_eating/cow_eating_7.png"),
  ] as const;
  const COW_HEART_FRAMES = [
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_1.png"),
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_2.png"),
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_3.png"),
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_4.png"),
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_5.png"),
    require("@/assets/Game/Sprites/cow-animation/Cow_heart/Cow_heart_6.png"),
  ] as const;
  const COW_FRAME_COUNT = COW_EATING_FRAMES.length;
  const COW_HEART_FRAME_COUNT = COW_HEART_FRAMES.length;
  /** Milliseconds between cow eating animation frames. */
  const COW_ANIM_INTERVAL_MS = 200;
  /** Milliseconds between cow heart (pet) animation frames. */
  const COW_HEART_ANIM_INTERVAL_MS = 200;
  const COW_DISPLAY_W = Math.round(ISLAND_W * 0.079);
  const COW_DISPLAY_H = Math.round(ISLAND_H * 0.112);

  const CHICKEN_IDLE_FRAMES = [
    require("@/assets/Game/Sprites/Chickens_animations/Idle/Mask group.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Idle/Mask group-1.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Idle/Mask group-2.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Idle/Mask group-3.png"),
  ] as const;
  const CHICKEN_IDLE_FRAME_COUNT = CHICKEN_IDLE_FRAMES.length;
  const CHICKEN_PECK_FRAMES = [
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group-1.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group-2.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group-3.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group-4.png"),
    require("@/assets/Game/Sprites/Chickens_animations/Pecking_reverse/Mask group-5.png"),
  ] as const;
  const CHICKEN_PECK_FRAME_COUNT = CHICKEN_PECK_FRAMES.length;
  /** Milliseconds between idle and peck animation frames. */
  const CHICKEN_ANIM_INTERVAL_MS = 140;
  /** Idle loop duration before starting the next peck sequence. */
  const CHICKEN_IDLE_BEFORE_PECK_MS = 3200;
  const CHICKEN_DISPLAY_W = Math.round(ISLAND_W * 0.032);
  const CHICKEN_DISPLAY_H = Math.round(ISLAND_H * 0.05);
  /** East on the flat ground: right of the hills / cow terrace, left of shake tree (~0.96). */
  const CHICKEN_WORLD_X = ISLAND_LEFT + ISLAND_W * 0.92;
  const CHICKEN_WORLD_Y = ISLAND_TOP + ISLAND_H * 0.415;
  const CHICKEN_DEPTH_Y = CHICKEN_WORLD_Y;
  const CHICKEN_TRUNK_HALF_W = Math.max(6, Math.round(CHICKEN_DISPLAY_W * 0.2));
  const CHICKEN_TRUNK_TOP =
    CHICKEN_WORLD_Y - Math.round(CHICKEN_DISPLAY_H * 0.38);

  /** Activities kiosk on east grass (same anchor as the cow before it moved onto the hills). */
  const ACTIVITIES_HEADING = require("@/assets/Game/activities/Heading.png");
  const ACTIVITIES_BREATHING = require("@/assets/Game/activities/Breathing.png");
  const ACTIVITIES_PUZZLES = require("@/assets/Game/activities/Puzzles.png");
  const ACTIVITIES_GRATITUDE = require("@/assets/Game/activities/Gratitude.png");
  const ACTIVITIES_CENTER_X = Math.round(ISLAND_LEFT + ISLAND_W * 0.882);
  const ACTIVITIES_GROUND_Y = Math.round(ISLAND_TOP + ISLAND_H * 0.456);
  /** Feet Y north of this line = draw character behind the activities cluster. */
  const ACTIVITIES_DEPTH_Y = ACTIVITIES_GROUND_Y;
  const ACTIVITIES_ICON_W = Math.max(32, Math.round(ISLAND_W * 0.032));
  const ACTIVITIES_ICON_H = Math.round(ACTIVITIES_ICON_W * (141 / 151));
  const ACTIVITIES_ICON_GAP = Math.max(9, Math.round(ISLAND_W * 0.0155));
  const ACTIVITIES_ROW_W =
    3 * ACTIVITIES_ICON_W + 2 * ACTIVITIES_ICON_GAP;
  /** Narrower than the icon row; cap keeps the banner visually light. */
  const ACTIVITIES_HEADING_W = Math.min(
    Math.round(ACTIVITIES_ROW_W * 0.85),
    Math.round(ISLAND_W * 0.108),
  );
  const ACTIVITIES_HEADING_H = Math.round(
    ACTIVITIES_HEADING_W * (111 / 354),
  );
  const ACTIVITIES_HEADING_ICON_GAP = Math.max(
    10,
    Math.round(ISLAND_H * 0.019),
  );
  const ACTIVITIES_ICONS_TOP = ACTIVITIES_GROUND_Y - ACTIVITIES_ICON_H;
  const ACTIVITIES_HEADING_TOP =
    ACTIVITIES_ICONS_TOP -
    ACTIVITIES_HEADING_ICON_GAP -
    ACTIVITIES_HEADING_H;
  const ACTIVITIES_HEADING_LEFT =
    ACTIVITIES_CENTER_X - Math.round(ACTIVITIES_HEADING_W / 2);
  const ACTIVITIES_ICONS_ROW_LEFT =
    ACTIVITIES_CENTER_X - Math.round(ACTIVITIES_ROW_W / 2);
  const ACTIVITIES_BREATHING_LEFT = ACTIVITIES_ICONS_ROW_LEFT;
  const ACTIVITIES_PUZZLES_LEFT =
    ACTIVITIES_ICONS_ROW_LEFT + ACTIVITIES_ICON_W + ACTIVITIES_ICON_GAP;
  const ACTIVITIES_GRATITUDE_LEFT =
    ACTIVITIES_ICONS_ROW_LEFT +
    2 * (ACTIVITIES_ICON_W + ACTIVITIES_ICON_GAP);
  const ACTIVITIES_CLUSTER_HALF_W =
    Math.max(
      Math.ceil(ACTIVITIES_HEADING_W / 2),
      Math.ceil(ACTIVITIES_ROW_W / 2),
    ) + Math.max(6, Math.round(ISLAND_W * 0.006));
  const ACTIVITIES_CLUSTER_TOP = ACTIVITIES_HEADING_TOP;

  /**
   * Narrow stand collision (center post only): player can walk past the left/right
   * sides of the kiosk while still colliding with its base.
   */
  const ACTIVITIES_TRUNK_HALF_W = Math.max(
    10,
    Math.round(ACTIVITIES_ICON_W * 0.38),
  );
  const ACTIVITIES_TRUNK_TOP = ACTIVITIES_ICONS_TOP;
  const ACTIVITIES_TRUNK_BOTTOM = ACTIVITIES_GROUND_Y;

  const TREE_SHAKE_FRAMES = [
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_1.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_2.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_3.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_4.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_5.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_6.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_7.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_8.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_9.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_10.png"),
    require("@/assets/Game/Sprites/shake_tree/Tree_shake_11.png"),
  ] as const;
  const TREE_SHAKE_FRAME_COUNT = TREE_SHAKE_FRAMES.length;
  const SHAKE_TREE_DISPLAY_W = Math.round(ISLAND_W * 0.085);
  const SHAKE_TREE_DISPLAY_H = Math.round(ISLAND_H * 0.15);
  const SHAKE_TREE_WORLD_X = ISLAND_LEFT + ISLAND_W * 0.96;
  const SHAKE_TREE_WORLD_Y = ISLAND_TOP + ISLAND_H * 0.3;
  /** Feet Y north of this line = draw character behind shake tree (same as ground line). */
  const SHAKE_TREE_DEPTH_Y = SHAKE_TREE_WORLD_Y;
  const SHAKE_TREE_TRUNK_HALF_W = Math.max(
    12,
    Math.round(SHAKE_TREE_DISPLAY_W * 0.22),
  );
  const SHAKE_TREE_TRUNK_TOP =
    SHAKE_TREE_WORLD_Y - Math.round(SHAKE_TREE_DISPLAY_H * 0.38);
  /** Same interaction pattern as cow: slightly below sprite midpoint + matching radius scale. */
  const SHAKE_TREE_INTERACT_CENTER_X = SHAKE_TREE_WORLD_X;
  const SHAKE_TREE_INTERACT_CENTER_Y =
    SHAKE_TREE_WORLD_Y -
    Math.round(SHAKE_TREE_DISPLAY_H / 2) +
    Math.round(SHAKE_TREE_DISPLAY_H * 0.14);
  const SHAKE_TREE_INTERACT_RADIUS = Math.max(
    46,
    Math.round(Math.min(SHAKE_TREE_DISPLAY_W, SHAKE_TREE_DISPLAY_H) * 0.7),
  );

  const HILLS = require("@/assets/Game/hills/hills.png");
  const HILLS_SCALE = ISLAND_W / 1751;
  const HILLS_W = Math.round(417 * HILLS_SCALE);
  const HILLS_H = Math.round(219 * HILLS_SCALE);
  const HILLS_LEFT = ISLAND_LEFT + ISLAND_W * 0.34 - HILLS_W / 2;
  const HILLS_TOP = ISLAND_TOP + ISLAND_H * 0.14 - HILLS_H / 2;

  /** Right terrace of `hills.png` (grass near the house entrance arrow). */
  const COW_WORLD_X = HILLS_LEFT + Math.round(HILLS_W * 0.2);
  const COW_WORLD_Y = HILLS_TOP + Math.round(HILLS_H * 0.48);
  /** Feet Y north of this line = draw character behind the cow (ground line at sprite base). */
  const COW_DEPTH_Y = COW_WORLD_Y;
  const COW_TRUNK_HALF_W = Math.max(10, Math.round(COW_DISPLAY_W * 0.22));
  const COW_TRUNK_TOP = COW_WORLD_Y - Math.round(COW_DISPLAY_H * 0.38);
  /** "Pet" proximity: slightly below sprite midpoint (toward hooves / ground). */
  const COW_INTERACT_CENTER_X = COW_WORLD_X;
  const COW_INTERACT_CENTER_Y =
    COW_WORLD_Y -
    Math.round(COW_DISPLAY_H / 2) +
    Math.round(COW_DISPLAY_H * 0.14);
  const COW_INTERACT_RADIUS = Math.max(
    46,
    Math.round(Math.min(COW_DISPLAY_W, COW_DISPLAY_H) * 0.7),
  );

  const HILLS_BTM1 = require("@/assets/Game/hills/Hills-bottom-1.png");
  const HILLS_BTM2 = require("@/assets/Game/hills/Hills-bottom-2.png");
  const HBTM1_W = Math.round(172 * HILLS_SCALE);
  const HBTM1_H = Math.round(30 * HILLS_SCALE);
  const HBTM2_W = Math.round(128 * HILLS_SCALE);
  const HBTM2_H = Math.round(29 * HILLS_SCALE);

  const HBTM1_LEFT = HILLS_LEFT + HILLS_W * -0.0;
  const HBTM1_TOP = HILLS_TOP + HILLS_H - HBTM1_H * 2.5;
  const HBTM2_LEFT = HILLS_LEFT + HILLS_W * 0.694;
  const HBTM2_TOP = HILLS_TOP + HILLS_H - HBTM2_H * 2.2;

  /** Bush sitting just below the left hill-bottom strip (sprite 49×48). */
  const BUSH_2 = require("@/assets/Game/Misc/Bush_2.png");
  const BUSH_2_W = Math.max(16, Math.round(49 * HILLS_SCALE * 1.02));
  const BUSH_2_H = Math.round(BUSH_2_W * (48 / 49));
  const BUSH_2_LEFT =
    HBTM1_LEFT +
    Math.round((HBTM1_W - BUSH_2_W) / 2) +
    Math.round(HBTM1_W * 0.36);
  const BUSH_2_TOP = HBTM1_TOP + HBTM1_H - Math.round(BUSH_2_H * 0.1) - 6;

  /** Rock on the grass just past the right edge of the cliff (sprite 43×48). */
  const ROCK = require("@/assets/Game/Misc/Rock.png");
  const ROCK_W = Math.round(HILLS_W * 0.1);
  const ROCK_H = Math.round(ROCK_W * (48 / 43));
  const ROCK_LEFT = HILLS_LEFT + HILLS_W + Math.round(HILLS_W * 0.05);
  const ROCK_TOP = HILLS_TOP + Math.round(HILLS_H * 0.54);

  /** Tall bush on the upper-left terrace of the hill (sprite 52×92). */
  const TALL_BUSH = require("@/assets/Game/Misc/Tall_bush.png");
  const TALL_BUSH_DISPLAY_W = Math.round(HILLS_W * 0.13);
  const TALL_BUSH_DISPLAY_H = Math.round(TALL_BUSH_DISPLAY_W * (92 / 52));
  const TALL_BUSH_WORLD_X = HILLS_LEFT + Math.round(HILLS_W * 0.09);
  const TALL_BUSH_WORLD_Y = HILLS_TOP + Math.round(HILLS_H * 0.36);
  const TALL_BUSH_LEFT =
    TALL_BUSH_WORLD_X - Math.round(TALL_BUSH_DISPLAY_W / 2);
  const TALL_BUSH_TOP = TALL_BUSH_WORLD_Y - TALL_BUSH_DISPLAY_H;
  const TALL_BUSH_DEPTH_Y = TALL_BUSH_WORLD_Y;

  const ARROW_X = HILLS_LEFT + HILLS_W * 0.84;
  const ARROW_Y = HILLS_TOP + HILLS_H * 0.75;
  const ARROW_SIZE = Math.round(HILLS_W * 0.08);

  const HOUSE_FRAME = require("@/assets/Game/house/house-frame.png");
  const HOUSE_FLOOR = require("@/assets/Game/house/house-floor.png");
  const HOUSE_BED = require("@/assets/Game/house/house-bed.png");
  const HOUSE_DRAWER = require("@/assets/Game/house/house-drawer.png");
  const HOUSE_IMAGE = require("@/assets/Game/house/house-image.png");
  const HOUSE_DESK = require("@/assets/Game/house/desk-and-table.png");
  /** Bottom facade strip (231×42); drawn above character when inside (z-order). */
  const HOUSE_FRONT = require("@/assets/Game/house/house_front.png");
  /** Roof overlay (231×168); shown only when the player is outside the house. */
  const HOUSE_ROOFTOP = require("@/assets/Game/house/rooftop.png");

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
  const HIMG_Y = Math.round(18 * HOUSE_SCALE);
  const HIMG_W = Math.round(29 * HOUSE_SCALE);
  const HIMG_H = Math.round(19 * HOUSE_SCALE);

  const HDRAWER_X = Math.round(138 * HOUSE_SCALE);
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

  /** Sprite bottom Y for indoor depth sort (feetY below this line = char behind object). */
  const HIMG_DEPTH_Y = HOUSE_TOP + HIMG_Y + HIMG_H;
  const HDRAWER_DEPTH_Y = HOUSE_TOP + HDRAWER_Y + HDRAWER_H;
  const HBED_DEPTH_Y = HOUSE_TOP + HBED_Y + HBED_H;
  const HDESK_DEPTH_Y = HOUSE_TOP + HDESK_Y + HDESK_H;

  const HOUSE_FRONT_W = Math.round(231 * HOUSE_SCALE);
  const HOUSE_FRONT_H = Math.round(42 * HOUSE_SCALE);
  const HOUSE_FRONT_LEFT =
    HOUSE_LEFT + Math.round((HOUSE_W - HOUSE_FRONT_W) / 2);
  const HOUSE_FRONT_TOP = HOUSE_TOP + HOUSE_H - HOUSE_FRONT_H;

  const HOUSE_ROOFTOP_W = Math.round(231 * HOUSE_SCALE);
  const HOUSE_ROOFTOP_H = Math.round(168 * HOUSE_SCALE);
  const HOUSE_ROOFTOP_LEFT =
    HOUSE_LEFT + Math.round((HOUSE_W - HOUSE_ROOFTOP_W) / 2);
  const HOUSE_ROOFTOP_TOP = HOUSE_TOP;

  const HOUSE_DOOR_X = HOUSE_LEFT + HOUSE_W * 0.2;
  const HOUSE_DOOR_Y = HOUSE_TOP + HOUSE_H - 2;
  const HOUSE_DOOR_RADIUS = 18;
  const HOUSE_EXIT_X = HOUSE_LEFT + INTERIOR_X + INTERIOR_W * 0.1;
  const HOUSE_EXIT_Y = HOUSE_TOP + INTERIOR_Y + INTERIOR_H - 40;
  /** Indoor exit proximity: horizontal oval (wider than the old circle). */
  const HOUSE_EXIT_RX = Math.round(38 * HOUSE_SCALE);
  const HOUSE_EXIT_RY = Math.round(15 * HOUSE_SCALE);
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

  /** Path from door onto grass (sprite 41×80); top tucks under house bottom. */
  const WALKWAY = require("@/assets/Game/house/Walkway.png");
  const WALKWAY_DISPLAY_W = Math.round(HOUSE_W * 0.11);
  const WALKWAY_DISPLAY_H = Math.round(WALKWAY_DISPLAY_W * (80 / 41));
  const WALKWAY_LEFT = Math.round(HOUSE_DOOR_X - WALKWAY_DISPLAY_W / 2);
  const WALKWAY_TOP =
    HOUSE_TOP + HOUSE_H - Math.round(WALKWAY_DISPLAY_H * 0.08);

  /** Decorative tree to the left of the house (sprite 191×176, aspect preserved). */
  const BIG_TREE = require("@/assets/Game/Misc/Big_tree.png");
  const BIG_TREE_DISPLAY_W = Math.round(ISLAND_W * 0.095);
  const BIG_TREE_DISPLAY_H = Math.round(BIG_TREE_DISPLAY_W * (176 / 191));
  const BIG_TREE_WORLD_X = HOUSE_LEFT - Math.round(BIG_TREE_DISPLAY_W * 0.52);
  const BIG_TREE_WORLD_Y = HOUSE_TOP + HOUSE_H * 0.04;
  const BIG_TREE_DEPTH_Y = BIG_TREE_WORLD_Y;
  const BIG_TREE_TRUNK_HALF_W = Math.max(
    12,
    Math.round(BIG_TREE_DISPLAY_W * 0.2),
  );
  const BIG_TREE_TRUNK_TOP =
    BIG_TREE_WORLD_Y - Math.round(BIG_TREE_DISPLAY_H * 0.36);

  /** Stone well just left of the house (sprite 49×49). */
  const WELL = require("@/assets/Game/Misc/Well.png");
  const WELL_DISPLAY_W = Math.round(HOUSE_W * 0.16);
  const WELL_DISPLAY_H = WELL_DISPLAY_W;
  const WELL_GAP_FROM_HOUSE = Math.round(HOUSE_W * 0.46);
  const WELL_LEFT = HOUSE_LEFT - WELL_GAP_FROM_HOUSE - WELL_DISPLAY_W;
  const WELL_WORLD_X = WELL_LEFT + Math.round(WELL_DISPLAY_W / 2);
  const WELL_WORLD_Y = HOUSE_TOP + Math.round(HOUSE_H * 0.48);
  const WELL_TOP = WELL_WORLD_Y - WELL_DISPLAY_H;
  const WELL_DEPTH_Y = WELL_WORLD_Y;
  const WELL_TRUNK_HALF_W = Math.max(10, Math.round(WELL_DISPLAY_W * 0.28));
  const WELL_TRUNK_TOP = WELL_WORLD_Y - Math.round(WELL_DISPLAY_H * 0.45);

  /**
   * Decorative sunflower on grass near the coast (~62% × 40% of island;
   * sprite 34×67).
   */
  const PLANT = require("@/assets/Game/Misc/Plant.png");
  const PLANT_DISPLAY_W = Math.round(ISLAND_W * 0.024);
  const PLANT_DISPLAY_H = Math.round(PLANT_DISPLAY_W * (67 / 34));
  const PLANT_WORLD_X = ISLAND_LEFT + Math.round(ISLAND_W * 0.62);
  const PLANT_WORLD_Y = ISLAND_TOP + Math.round(ISLAND_H * 0.28);
  const PLANT_LEFT = PLANT_WORLD_X - Math.round(PLANT_DISPLAY_W / 2);
  const PLANT_TOP = PLANT_WORLD_Y - PLANT_DISPLAY_H;
  const PLANT_DEPTH_Y = PLANT_WORLD_Y;

  const GARDEN_FLOOR = require("@/assets/Game/garden/garden-floor.png");
  const GARDEN_BACK = require("@/assets/Game/garden/Back.png");
  const GARDEN_SIDES = require("@/assets/Game/garden/garden-sides.png");
  const GARDEN_FRONTS = [
    require("@/assets/Game/garden/Front-1.png"),
    require("@/assets/Game/garden/Front-2.png"),
    require("@/assets/Game/garden/Front-3.png"),
    require("@/assets/Game/garden/Front-4.png"),
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

  function isActivitiesTrunkBlocking(worldX: number, feetY: number): boolean {
    if (feetY < ACTIVITIES_TRUNK_TOP || feetY > ACTIVITIES_TRUNK_BOTTOM)
      return false;
    return (
      worldX >= ACTIVITIES_CENTER_X - ACTIVITIES_TRUNK_HALF_W &&
      worldX <= ACTIVITIES_CENTER_X + ACTIVITIES_TRUNK_HALF_W
    );
  }

  /** South of the banner art (camera-facing side): block so the player can't stand in front of the header. */
  function isActivitiesHeaderFrontBlocking(
    worldX: number,
    feetY: number,
  ): boolean {
    const headingBottom = ACTIVITIES_HEADING_TOP + ACTIVITIES_HEADING_H;
    if (feetY < headingBottom || feetY > ACTIVITIES_GROUND_Y) return false;
    return (
      worldX >= ACTIVITIES_HEADING_LEFT &&
      worldX <= ACTIVITIES_HEADING_LEFT + ACTIVITIES_HEADING_W
    );
  }

  function isActivitiesWalkBlocking(worldX: number, feetY: number): boolean {
    return (
      isActivitiesHeaderFrontBlocking(worldX, feetY) ||
      isActivitiesTrunkBlocking(worldX, feetY)
    );
  }

  /** Same depth rule as other island props: feet north of ground line = character behind the cluster. */
  function isActivitiesCharBehind(_worldX: number, feetY: number): boolean {
    return feetY < ACTIVITIES_DEPTH_Y;
  }

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
    TREE_INTERACT_CENTER_X,
    TREE_INTERACT_CENTER_Y,
    TREE_INTERACT_RADIUS,
    TREE_DEPTH_Y,
    TREE_TRUNK_HALF_W,
    TREE_TRUNK_TOP,
    COW_EATING_FRAMES,
    COW_HEART_FRAMES,
    COW_FRAME_COUNT,
    COW_HEART_FRAME_COUNT,
    COW_ANIM_INTERVAL_MS,
    COW_HEART_ANIM_INTERVAL_MS,
    COW_DISPLAY_W,
    COW_DISPLAY_H,
    COW_WORLD_X,
    COW_WORLD_Y,
    COW_DEPTH_Y,
    COW_INTERACT_CENTER_X,
    COW_INTERACT_CENTER_Y,
    COW_INTERACT_RADIUS,
    COW_TRUNK_HALF_W,
    COW_TRUNK_TOP,
    CHICKEN_IDLE_FRAMES,
    CHICKEN_IDLE_FRAME_COUNT,
    CHICKEN_PECK_FRAMES,
    CHICKEN_PECK_FRAME_COUNT,
    CHICKEN_ANIM_INTERVAL_MS,
    CHICKEN_IDLE_BEFORE_PECK_MS,
    CHICKEN_DISPLAY_W,
    CHICKEN_DISPLAY_H,
    CHICKEN_WORLD_X,
    CHICKEN_WORLD_Y,
    CHICKEN_DEPTH_Y,
    CHICKEN_TRUNK_HALF_W,
    CHICKEN_TRUNK_TOP,
    ACTIVITIES_HEADING,
    ACTIVITIES_BREATHING,
    ACTIVITIES_PUZZLES,
    ACTIVITIES_GRATITUDE,
    ACTIVITIES_CENTER_X,
    ACTIVITIES_GROUND_Y,
    ACTIVITIES_DEPTH_Y,
    ACTIVITIES_ICON_W,
    ACTIVITIES_ICON_H,
    ACTIVITIES_HEADING_LEFT,
    ACTIVITIES_HEADING_TOP,
    ACTIVITIES_HEADING_W,
    ACTIVITIES_HEADING_H,
    ACTIVITIES_ICONS_TOP,
    ACTIVITIES_BREATHING_LEFT,
    ACTIVITIES_PUZZLES_LEFT,
    ACTIVITIES_GRATITUDE_LEFT,
    ACTIVITIES_CLUSTER_TOP,
    ACTIVITIES_CLUSTER_HALF_W,
    isActivitiesWalkBlocking,
    isActivitiesCharBehind,
    BIG_TREE,
    BIG_TREE_DISPLAY_W,
    BIG_TREE_DISPLAY_H,
    BIG_TREE_WORLD_X,
    BIG_TREE_WORLD_Y,
    BIG_TREE_DEPTH_Y,
    BIG_TREE_TRUNK_HALF_W,
    BIG_TREE_TRUNK_TOP,
    WELL,
    WELL_DISPLAY_W,
    WELL_DISPLAY_H,
    WELL_LEFT,
    WELL_TOP,
    WELL_WORLD_X,
    WELL_WORLD_Y,
    WELL_DEPTH_Y,
    WELL_TRUNK_HALF_W,
    WELL_TRUNK_TOP,
    PLANT,
    PLANT_DISPLAY_W,
    PLANT_DISPLAY_H,
    PLANT_LEFT,
    PLANT_TOP,
    PLANT_DEPTH_Y,
    TREE_SHAKE_FRAMES,
    TREE_SHAKE_FRAME_COUNT,
    SHAKE_TREE_DISPLAY_W,
    SHAKE_TREE_DISPLAY_H,
    SHAKE_TREE_WORLD_X,
    SHAKE_TREE_WORLD_Y,
    SHAKE_TREE_INTERACT_CENTER_X,
    SHAKE_TREE_INTERACT_CENTER_Y,
    SHAKE_TREE_INTERACT_RADIUS,
    SHAKE_TREE_DEPTH_Y,
    SHAKE_TREE_TRUNK_HALF_W,
    SHAKE_TREE_TRUNK_TOP,
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
    BUSH_2,
    BUSH_2_W,
    BUSH_2_H,
    BUSH_2_LEFT,
    BUSH_2_TOP,
    ROCK,
    ROCK_W,
    ROCK_H,
    ROCK_LEFT,
    ROCK_TOP,
    TALL_BUSH,
    TALL_BUSH_DISPLAY_W,
    TALL_BUSH_DISPLAY_H,
    TALL_BUSH_LEFT,
    TALL_BUSH_TOP,
    TALL_BUSH_DEPTH_Y,
    ARROW_X,
    ARROW_Y,
    ARROW_SIZE,
    HOUSE_FRAME,
    HOUSE_FLOOR,
    HOUSE_BED,
    HOUSE_DRAWER,
    HOUSE_IMAGE,
    HOUSE_DESK,
    HOUSE_FRONT,
    HOUSE_FRONT_LEFT,
    HOUSE_FRONT_TOP,
    HOUSE_FRONT_W,
    HOUSE_FRONT_H,
    HOUSE_ROOFTOP,
    HOUSE_ROOFTOP_LEFT,
    HOUSE_ROOFTOP_TOP,
    HOUSE_ROOFTOP_W,
    HOUSE_ROOFTOP_H,
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
    HIMG_DEPTH_Y,
    HDRAWER_DEPTH_Y,
    HBED_DEPTH_Y,
    HDESK_DEPTH_Y,
    HOUSE_DOOR_X,
    HOUSE_DOOR_Y,
    HOUSE_DOOR_RADIUS,
    HOUSE_EXIT_X,
    HOUSE_EXIT_Y,
    HOUSE_EXIT_RX,
    HOUSE_EXIT_RY,
    HOUSE_ENTER_POS,
    HOUSE_INTERIOR_RECT,
    WALKWAY,
    WALKWAY_DISPLAY_W,
    WALKWAY_DISPLAY_H,
    WALKWAY_LEFT,
    WALKWAY_TOP,
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
