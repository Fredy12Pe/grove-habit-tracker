/**
 * Plant sprite manifest: 28 plants × 7 growth frames (day-of-week).
 * All requires are static so Metro can bundle them.
 */

export const PLANT_COUNT = 28;
export const FRAMES_PER_PLANT = 7;

export type PlantSpriteSource = number;

// [plantIndex 0-27][frame 0-6]
const PLANT_SPRITES: PlantSpriteSource[][] = [
  // 01 - Witherleaf
  [
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4168.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4169.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4170.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4171.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4172.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4173.png"),
    require("@/assets/game/Plants/01 - Witherleaf/sprite_4174.png"),
  ],
  // 02 - Aurora Sprout
  [
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4101.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4102.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4103.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4104.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4105.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4106.png"),
    require("@/assets/game/Plants/02 - Aurora Sprout/sprite_4107.png"),
  ],
  // 03 - Seedling Hope
  [
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3456.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3457.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3458.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3459.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3460.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3461.png"),
    require("@/assets/game/Plants/03 - Seedling Hope/sprite_3462.png"),
  ],
  // 04 - Droop Lily
  [
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3395.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3396.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3397.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3398.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3399.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3400.png"),
    require("@/assets/game/Plants/04 - Droop Lily/sprite_3401.png"),
  ],
  // 05 - Radiant Bloom
  [
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3321.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3322.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3323.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3324.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3325.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3326.png"),
    require("@/assets/game/Plants/05 - Radiant Bloom/sprite_3327.png"),
  ],
  // 06 - Spiral Vine
  [
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3212.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3213.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3214.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3215.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3216.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3217.png"),
    require("@/assets/game/Plants/06 - Spiral Vine/sprite_3218.png"),
  ],
  // 07 - Bellflower Drift
  [
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3139.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3140.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3141.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3142.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3143.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3144.png"),
    require("@/assets/game/Plants/07 - Bellflower Drift/sprite_3145.png"),
  ],
  // 08 - Crystal Stem
  [
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3066.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3067.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3068.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3069.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3070.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3071.png"),
    require("@/assets/game/Plants/08 - Crystal Stem/sprite_3072.png"),
  ],
  // 09 - Ember Reed
  [
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2994.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2995.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2996.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2997.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2998.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_2999.png"),
    require("@/assets/game/Plants/09 - Ember Reed/sprite_3000.png"),
  ],
  // 10 - Mistcap Shroom
  [
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2843.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2844.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2845.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2846.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2847.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2848.png"),
    require("@/assets/game/Plants/10 - Mistcap Shroom/sprite_2849.png"),
  ],
  // 11 - Berrybright
  [
    require("@/assets/game/Plants/11 - Berrybright/sprite_2722.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2723.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2724.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2725.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2726.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2727.png"),
    require("@/assets/game/Plants/11 - Berrybright/sprite_2728.png"),
  ],
  // 12 - Prism Bloom
  [
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2572.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2573.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2574.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2575.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2576.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2577.png"),
    require("@/assets/game/Plants/12 - Prism Bloom/sprite_2578.png"),
  ],
  // 13 - Twilight Petal
  [
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2495.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2496.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2497.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2498.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2499.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2500.png"),
    require("@/assets/game/Plants/13 - Twilight Petal/sprite_2501.png"),
  ],
  // 14 - Thornshade
  [
    require("@/assets/game/Plants/14 - Thornshade/sprite_2377.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2378.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2379.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2380.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2381.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2382.png"),
    require("@/assets/game/Plants/14 - Thornshade/sprite_2383.png"),
  ],
  // 15 - Sunflare
  [
    require("@/assets/game/Plants/15 - Sunflare/sprite_2248.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2249.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2250.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2251.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2252.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2253.png"),
    require("@/assets/game/Plants/15 - Sunflare/sprite_2254.png"),
  ],
  // 16 - Bonsai Buddy
  [
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1942.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1943.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1944.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1945.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1946.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1947.png"),
    require("@/assets/game/Plants/16 - Bonsai Buddy/sprite_1948.png"),
  ],
  // 17 - Honey Puff
  [
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1868.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1869.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1870.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1871.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1872.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1873.png"),
    require("@/assets/game/Plants/17 - Honey Puff/sprite_1874.png"),
  ],
  // 18 - Buzzbud
  [
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1758.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1759.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1760.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1761.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1762.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1763.png"),
    require("@/assets/game/Plants/18 - Buzzbud/sprite_1764.png"),
  ],
  // 19 - Starroot
  [
    require("@/assets/game/Plants/19 - Starroot/sprite_1642.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1643.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1644.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1645.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1646.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1647.png"),
    require("@/assets/game/Plants/19 - Starroot/sprite_1648.png"),
  ],
  // 20 - Aloe Guard
  [
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1569.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1570.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1571.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1572.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1573.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1574.png"),
    require("@/assets/game/Plants/20 - Aloe Guard/sprite_1575.png"),
  ],
  // 21 - Twinbud
  [
    require("@/assets/game/Plants/21 - Twinbud/sprite_1404.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1405.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1406.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1407.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1408.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1409.png"),
    require("@/assets/game/Plants/21 - Twinbud/sprite_1410.png"),
  ],
  // 22 - Frost Fern
  [
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1264.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1265.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1266.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1267.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1268.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1269.png"),
    require("@/assets/game/Plants/22 - Frost Fern/sprite_1270.png"),
  ],
  // 23 - Verdant Spike
  [
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1185.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1186.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1187.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1188.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1189.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1190.png"),
    require("@/assets/game/Plants/23 - Verdant Spike/sprite_1191.png"),
  ],
  // 24 - Candy Bloom
  [
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1118.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1119.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1120.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1121.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1122.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1123.png"),
    require("@/assets/game/Plants/24 - Candy Bloom/sprite_1124.png"),
  ],
  // 25 - Desert Pillar
  [
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_990.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_991.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_992.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_993.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_994.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_995.png"),
    require("@/assets/game/Plants/25 - Desert Pillar/sprite_996.png"),
  ],
  // 26 - Flamebranch
  [
    require("@/assets/game/Plants/26 - Flamebranch/sprite_493.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_494.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_495.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_496.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_497.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_498.png"),
    require("@/assets/game/Plants/26 - Flamebranch/sprite_499.png"),
  ],
  // 27 - Drytwig
  [
    require("@/assets/game/Plants/27 - Drytwig/sprite_139.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_140.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_141.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_142.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_143.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_144.png"),
    require("@/assets/game/Plants/27 - Drytwig/sprite_145.png"),
  ],
  // 28 - Ember Bud
  [
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2321.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2322.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2323.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2324.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2325.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2326.png"),
    require("@/assets/game/Plants/28 - Ember Bud/sprite_2327.png"),
  ],
];

/** Get sprite for plant index (0–27) and day-of-week frame (0–6). */
export function getPlantSprite(plantIndex: number, frameIndex: number): PlantSpriteSource {
  const pi = Math.max(0, Math.min(plantIndex, PLANT_COUNT - 1));
  const fi = Math.max(0, Math.min(frameIndex, FRAMES_PER_PLANT - 1));
  return PLANT_SPRITES[pi][fi];
}

/** Week key for deterministic plant assignment (Sunday start). */
export function getWeekKey(date: Date = new Date()): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

/** Plant index for a habit slot this week (0–27). */
export function getPlantIndexForHabitSlot(habitIndex: number, weekKey: string): number {
  const weekSeed = weekKey.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return (habitIndex + weekSeed) % PLANT_COUNT;
}

/** Frame index from day of week (0 = Sunday … 6 = Saturday). */
export function getFrameIndexForDay(date: Date = new Date()): number {
  const day = date.getDay();
  return Math.min(day, FRAMES_PER_PLANT - 1);
}
