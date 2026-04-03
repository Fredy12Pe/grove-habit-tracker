## iOS widget assets

Drop exported widget images here (from Figma).

### Structure

- `small/`: systemSmall widget assets
- `large/`: systemLarge widget assets
- `shared/`: assets shared across widget sizes (icons, mascot, etc.)

### Naming suggestions

- Prefer kebab-case: `header-bg.png`, `mascot.png`, `day-mon.png`
- If you export multiple resolutions, suffix with scale: `mascot@2x.png`, `mascot@3x.png`

### Small card

- Art files live in `small/` (`Sprout-small.png`, `habit-progress-icon.png`). After changing them, run `npm run sync-widget-small-assets` so the widget target’s `Assets.xcassets` stays in sync (also runs on `postinstall`).
- background (linear (45A427 --> 97C732) 100% opacity)
- Progress ring: **50×50 pt** circular ring, bottom-right **21 px** from right / **18 px** from bottom; track — white **50%** opacity; fill — white **100%**; stroke weight **~11**. Subtext in the widget is derived from completion % in Swift (matches the ring).
- corner radius 21.67
- Large text: White 100%, 15px semibold.
- Small subtext: White 70%, 12px, medium, all caps
- Padding between text - 2px

### Large card

- background (linear (45A427 --> 97C732) 100% opacity)
- plants section : background(#F4F3E7, 100%)
- corner radius 21.67
- Large text: White 100%, 20px semibold.
- Small subtext: White 70%, 12px, medium
- completed/not completed dot colors : completed(#88BF25, 100%), not completed(#AEBA9B, 100%)
- Padding between text - 4px
- plants box : Size(63x63px), color(#67B22B, 20%)
