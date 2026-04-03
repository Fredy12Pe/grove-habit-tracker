import SwiftUI
import WidgetKit

private let appGroupId = "group.com.groveHabits.app"

/// Asset catalog uses `plant_{0...27}_{0...6}` (see `plantImages.generated.js`).
private enum PlantAssetMetrics {
    static let maxPlantIndex = 27
    static let maxFrameIndex = 6
}

private let habitsDeepLink: URL = {
    if let u = URL(string: "grove:///(tabs)/habits") { return u }
    return URL(string: "grove:")!
}()

private enum Keys {
    static let daily = "grove_daily"
    static let weekly = "grove_weekly"
}

private func groupDefaults() -> UserDefaults? {
    UserDefaults(suiteName: appGroupId)
}

// MARK: - Colors (match React widgets)

private let smallWidgetGradient = LinearGradient(
    colors: [
        Color(red: 69 / 255, green: 164 / 255, blue: 39 / 255),
        Color(red: 151 / 255, green: 199 / 255, blue: 50 / 255),
    ],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
)

private let weeklyPlantStripBg = Color(red: 244 / 255, green: 243 / 255, blue: 231 / 255)
/// Week dots inside plant tiles: completed #88BF25, not completed white.
private let habitTileDotCompleted = Color(red: 136 / 255, green: 191 / 255, blue: 37 / 255)
private let habitTileDotIncomplete = Color.white
/// Habit tile fill: #67B22B at 20% opacity.
private let habitPlantTileFill = Color(red: 103 / 255, green: 178 / 255, blue: 43 / 255).opacity(0.2)

private enum WidgetLayout {
    static let cornerRadius: CGFloat = 21.67
}

// MARK: - Payloads

private struct DailyPayload: Codable {
    var completedCount: Int = 0
    var totalCount: Int = 0
    var title: String = "Today's Habits"
    var subtitle: String = ""

    static let empty = DailyPayload()
}

private struct WeeklyPayload: Codable {
    struct DayItem: Codable {
        let iso: String
        let completed: Bool
    }

    struct PlantItem: Codable {
        let habitId: String
        let plantIndex: Int
        let frameIndex: Int
        /// Mon–Sun completion for this habit only (optional for older JSON).
        let weekDays: [DayItem]?

        func weekDotsOrFallback(_ fallback: [DayItem]) -> [DayItem] {
            guard let w = weekDays, !w.isEmpty else { return fallback }
            return w
        }
    }

    var completedCountToday: Int = 0
    var totalCountToday: Int = 0
    var title: String = "Your garden is growing"
    var subtitle: String = ""
    var days: [DayItem] = []
    var plants: [PlantItem] = []

    static let empty = WeeklyPayload()
}

private func decodeDaily() -> DailyPayload {
    guard let raw = groupDefaults()?.string(forKey: Keys.daily),
          let data = raw.data(using: .utf8),
          let v = try? JSONDecoder().decode(DailyPayload.self, from: data)
    else { return .empty }
    return v
}

private func decodeWeekly() -> WeeklyPayload {
    guard let raw = groupDefaults()?.string(forKey: Keys.weekly),
          let data = raw.data(using: .utf8),
          let v = try? JSONDecoder().decode(WeeklyPayload.self, from: data)
    else { return .empty }
    return v
}

// MARK: - Single timeline for all families

private struct GroveWidgetEntry: TimelineEntry {
    let date: Date
    let daily: DailyPayload
    let weekly: WeeklyPayload
}

private struct GroveWidgetProvider: TimelineProvider {
    func placeholder(in _: Context) -> GroveWidgetEntry {
        GroveWidgetEntry(
            date: Date(),
            daily: DailyPayload(
                completedCount: 2,
                totalCount: 5,
                title: "Today's Habits",
                subtitle: "40% COMPLETED"
            ),
            weekly: WeeklyPayload(
                completedCountToday: 1,
                totalCountToday: 3,
                title: "Your garden is growing",
                subtitle: "1 of 3 habits completed",
                days: (0 ..< 7).map { WeeklyPayload.DayItem(iso: "", completed: $0 % 2 == 0) },
                plants: []
            )
        )
    }

    func getSnapshot(in _: Context, completion: @escaping (GroveWidgetEntry) -> Void) {
        completion(GroveWidgetEntry(date: Date(), daily: decodeDaily(), weekly: decodeWeekly()))
    }

    func getTimeline(in _: Context, completion: @escaping (Timeline<GroveWidgetEntry>) -> Void) {
        let entry = GroveWidgetEntry(date: Date(), daily: decodeDaily(), weekly: decodeWeekly())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

// MARK: - Small (systemSmall)

private enum SmallDailyWidgetMetrics {
    static let ringSize: CGFloat = 76
    static let ringStrokeWidth: CGFloat = 13
    static let ringTrailingInset: CGFloat = 21
    static let ringBottomInset: CGFloat = 18
    static let textTopInset: CGFloat = 16
    static let textLeadingInset: CGFloat = 16
    static let titleSubtitleSpacing: CGFloat = 2
}

private struct DailyProgressRing: View {
    var progress: Double

    private var w: CGFloat { SmallDailyWidgetMetrics.ringStrokeWidth }
    private var s: CGFloat { SmallDailyWidgetMetrics.ringSize }

    private var clamped: CGFloat {
        CGFloat(min(1, max(0, progress)))
    }

    var body: some View {
        let inner = s - w
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.5), lineWidth: w)
            if clamped >= 1 - 1e-6 {
                Circle()
                    .stroke(Color.white, lineWidth: w)
            } else if clamped > 0 {
                Circle()
                    .trim(from: 0, to: clamped)
                    .stroke(
                        Color.white,
                        style: StrokeStyle(lineWidth: w, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
            }
            Image("habitProgressIcon")
                .resizable()
                .interpolation(.high)
                .scaledToFit()
                .frame(width: 30, height: 30)
                .opacity(0.55)
        }
        .frame(width: inner, height: inner)
        .padding(w / 2)
        .frame(width: s, height: s)
    }
}

private struct DailyStatusView: View {
    let payload: DailyPayload

    private var progress: Double {
        guard payload.totalCount > 0 else { return 0 }
        return min(1, max(0, Double(payload.completedCount) / Double(payload.totalCount)))
    }

    private var statusSubtitle: String {
        let c = payload.completedCount
        let t = payload.totalCount
        if t <= 0 { return "START WITH ONE HABIT" }
        if c >= t { return "100% COMPLETED" }
        if c <= 0 { return "0% COMPLETED" }
        let pct = Int(round(Double(c) / Double(t) * 100))
        return "\(pct)% COMPLETED"
    }

    var body: some View {
        ZStack {
            VStack(alignment: .leading, spacing: SmallDailyWidgetMetrics.titleSubtitleSpacing) {
                Text(payload.title)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.leading)
                Text(statusSubtitle)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundStyle(.white.opacity(0.7))
                    .multilineTextAlignment(.leading)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
            .padding(.top, SmallDailyWidgetMetrics.textTopInset)
            .padding(.leading, SmallDailyWidgetMetrics.textLeadingInset)

            Image("SproutSmall")
                .resizable()
                .interpolation(.high)
                .scaledToFit()
                .frame(height: 100)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                .accessibilityHidden(true)

            DailyProgressRing(progress: progress)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                .padding(.trailing, SmallDailyWidgetMetrics.ringTrailingInset)
                .padding(.bottom, SmallDailyWidgetMetrics.ringBottomInset)
        }
    }
}

// MARK: - Large (systemLarge)

/// Large-widget character: `Sprout-quiet.png` / `Sprout-growing.png` / `Sprout-thriving.png` → xcassets (see `scripts/sync-widget-sprout-stages.js`).
/// Quiet when nothing completed today (`SproutQuiet`); thriving when all habits done; else growing.
private enum LargeSproutStage {
    case quiet
    case growing
    case thriving

    init(weekly: WeeklyPayload) {
        let total = weekly.totalCountToday
        let done = weekly.completedCountToday
        if done == 0 {
            self = .quiet
        } else if total > 0, done >= total {
            self = .thriving
        } else {
            self = .growing
        }
    }

    var assetName: String {
        switch self {
        case .quiet: return "SproutQuiet"
        case .growing: return "SproutGrowing"
        case .thriving: return "SproutThriving"
        }
    }
}

private struct PlantThumb: View {
    let plantIndex: Int
    let frameIndex: Int
    /// Fixed square for every plant; bottom alignment keeps pots on the same baseline across assets.
    let slot: CGFloat

    var body: some View {
        let pi = min(PlantAssetMetrics.maxPlantIndex, max(0, plantIndex))
        let fi = min(PlantAssetMetrics.maxFrameIndex, max(0, frameIndex))
        let name = "plant_\(pi)_\(fi)"
        Image(name)
            .resizable()
            .interpolation(.medium)
            .scaledToFit()
            .frame(width: slot, height: slot, alignment: .bottom)
    }
}

/// Plant tile: pixel plant + week dots row (matches reference grid cells).
private struct HabitPlantTile: View {
    let plant: WeeklyPayload.PlantItem
    let weekDays: [WeeklyPayload.DayItem]
    let tileWidth: CGFloat
    let tileHeight: CGFloat
    let plantSlot: CGFloat
    let tileCorner: CGFloat

    private var dotSize: CGFloat {
        max(3, min(5, tileWidth / 17))
    }

    private var dotSpacing: CGFloat {
        max(2, tileWidth * 0.028)
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: tileCorner, style: .continuous)
                .fill(habitPlantTileFill)
            VStack(spacing: 5) {
                PlantThumb(
                    plantIndex: plant.plantIndex,
                    frameIndex: plant.frameIndex,
                    slot: plantSlot
                )
                HStack(spacing: dotSpacing) {
                    ForEach(Array(weekDays.prefix(7).enumerated()), id: \.offset) { _, day in
                        Circle()
                            .fill(day.completed ? habitTileDotCompleted : habitTileDotIncomplete)
                            .frame(width: dotSize, height: dotSize)
                    }
                }
            }
        }
        .frame(width: tileWidth, height: tileHeight)
    }
}

/// Rows built outside `ViewBuilder` to avoid subtle device-only failures with `let` + nested `ForEach`.
/// Fixed padding around the grid: `paddingH` left/right, `paddingV` top/bottom (see `WeeklyLargeView`).
private struct WeeklyPlantGrid: View {
    let rows: [[WeeklyPayload.PlantItem]]
    /// Used when a plant has no `weekDays` (older payloads).
    let fallbackWeekDays: [WeeklyPayload.DayItem]
    let paddingH: CGFloat
    let paddingV: CGFloat
    /// Extra space left under the grid (grid sits higher in the cream strip).
    let gridLiftFromBottom: CGFloat
    private let columns = 4
    private let gridSpacing: CGFloat = 12
    private let dotBandHeight: CGFloat = 18

    var body: some View {
        GeometryReader { geo in
            // Whole-point sizes avoid float drift; padding uses EdgeInsets so top/bottom match exactly.
            let innerW = max(0, floor(geo.size.width - paddingH * 2))
            let innerH = max(0, floor(geo.size.height - paddingV * 2))
            let stripInsets = EdgeInsets(top: paddingV, leading: paddingH, bottom: paddingV, trailing: paddingH)

            Group {
                if rows.isEmpty {
                    Color.clear
                        .frame(width: innerW, height: innerH)
                } else {
                    WeeklyPlantGridRowStack(
                        rows: rows,
                        fallbackWeekDays: fallbackWeekDays,
                        innerW: innerW,
                        innerH: innerH,
                        gridLiftFromBottom: gridLiftFromBottom,
                        columns: columns,
                        gridSpacing: gridSpacing,
                        dotBandHeight: dotBandHeight
                    )
                }
            }
            .frame(width: innerW, height: innerH)
            .padding(stripInsets)
            .frame(width: geo.size.width, height: geo.size.height, alignment: .center)
        }
    }
}

private struct WeeklyPlantGridRowStack: View {
    let rows: [[WeeklyPayload.PlantItem]]
    let fallbackWeekDays: [WeeklyPayload.DayItem]
    let innerW: CGFloat
    let innerH: CGFloat
    let gridLiftFromBottom: CGFloat
    let columns: Int
    let gridSpacing: CGFloat
    let dotBandHeight: CGFloat

    private var tileW: CGFloat {
        let gapsH = CGFloat(columns - 1) * gridSpacing
        return max(36, (innerW - gapsH) / CGFloat(columns))
    }

    private var rowCount: Int { rows.count }

    private func plantMetrics(tileH: CGFloat) -> (plantSlot: CGFloat, tileCorner: CGFloat) {
        let plantBudget = max(28, tileH - dotBandHeight - 8)
        let plantSlot = max(26, min(tileW * 0.74, plantBudget * 0.98))
        let tileCorner = min(16, max(8, tileW * (14.0 / 84.0)))
        return (plantSlot, tileCorner)
    }

    var body: some View {
        let gapsV = CGFloat(rowCount - 1) * gridSpacing
        let lift = max(0, gridLiftFromBottom)
        let layoutH = max(48, innerH - lift)
        let rawTileH = (layoutH - gapsV) / CGFloat(rowCount)
        let tileH = max(36, floor(rawTileH))
        let pm = plantMetrics(tileH: tileH)
        ZStack(alignment: .bottomLeading) {
            VStack(alignment: .leading, spacing: gridSpacing) {
                ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                    HStack(alignment: .top, spacing: gridSpacing) {
                        ForEach(row, id: \.habitId) { p in
                            HabitPlantTile(
                                plant: p,
                                weekDays: p.weekDotsOrFallback(fallbackWeekDays),
                                tileWidth: tileW,
                                tileHeight: tileH,
                                plantSlot: pm.plantSlot,
                                tileCorner: pm.tileCorner
                            )
                        }
                    }
                }
            }
            .frame(width: innerW, alignment: .leading)
            .padding(.bottom, lift)
        }
        .frame(width: innerW, height: innerH)
    }
}

private struct WeeklyLargeView: View {
    let payload: WeeklyPayload

    /// Padding from cream edge to the plant grid.
    private let plantStripPaddingHorizontal: CGFloat = 16
    private let plantStripPaddingVertical: CGFloat = 20
    /// Raises the tile grid above the bottom of the padded area (more cream under the last row).
    private let plantStripGridLiftFromBottom: CGFloat = 18

    /// Plant grid + cream panel height (taller strip leaves less empty green above; grid stays centered inside via `WeeklyPlantGrid`).
    private let plantStripHeight: CGFloat = 228
    /// Sprout in the green header, bottom-aligned so feet sit on the cream strip edge (reference layout).
    private let sproutImageWidth: CGFloat = 172
    private let sproutImageHeight: CGFloat = 182

    /// Cream panel: square top corners, rounded bottom (matches widget corner radius).
    private var plantStripShape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            topLeadingRadius: 0,
            bottomLeadingRadius: WidgetLayout.cornerRadius,
            bottomTrailingRadius: WidgetLayout.cornerRadius,
            topTrailingRadius: 0,
            style: .continuous
        )
    }

    private var plantRows: [[WeeklyPayload.PlantItem]] {
        let perRow = 4
        let plants = payload.plants
        return stride(from: 0, to: plants.count, by: perRow).map {
            Array(plants[$0 ..< min($0 + perRow, plants.count)])
        }
    }

    private var sproutStage: LargeSproutStage {
        LargeSproutStage(weekly: payload)
    }

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: WidgetLayout.cornerRadius, style: .continuous)
                .fill(smallWidgetGradient)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Reference: green header with sprout (left) + copy (right), bottom-aligned to cream top; week dots live in each grid tile.
            VStack(spacing: 0) {
                Spacer(minLength: 0)

                HStack(alignment: .center, spacing: 5) {
                    Image(sproutStage.assetName)
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(width: sproutImageWidth, height: sproutImageHeight)
                        .accessibilityHidden(true)

                    VStack(alignment: .leading, spacing: 5) {
                        Text(payload.title)
                            .font(.system(size: 23, weight: .semibold))
                            .foregroundStyle(.white)
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(payload.subtitle)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.white.opacity(0.7))
                            .multilineTextAlignment(.leading)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.leading, 10)
                .padding(.trailing, 16)

                WeeklyPlantGrid(
                    rows: plantRows,
                    fallbackWeekDays: payload.days,
                    paddingH: plantStripPaddingHorizontal,
                    paddingV: plantStripPaddingVertical,
                    gridLiftFromBottom: plantStripGridLiftFromBottom
                )
                    .frame(maxWidth: .infinity, minHeight: plantStripHeight, maxHeight: plantStripHeight, alignment: .center)
                    .background {
                        plantStripShape.fill(weeklyPlantStripBg)
                    }
                    .clipShape(plantStripShape)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        }
    }
}

// MARK: - Family switch

private struct GroveHabitsRootView: View {
    var entry: GroveWidgetEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        switch family {
        case .systemSmall:
            DailyStatusView(payload: entry.daily)
        case .systemLarge:
            WeeklyLargeView(payload: entry.weekly)
        default:
            DailyStatusView(payload: entry.daily)
        }
    }
}

// MARK: - One widget, two sizes

struct GroveHabitsWidget: Widget {
    /// Keep in sync with `widgetTimelineKind` in `lib/widgets/widgetSharedStorage.ts`.
    let kind: String = "GroveHabitsWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GroveWidgetProvider()) { entry in
            GroveHabitsRootView(entry: entry)
                .widgetURL(habitsDeepLink)
                .containerBackground(for: .widget) {
                    RoundedRectangle(cornerRadius: WidgetLayout.cornerRadius, style: .continuous)
                        .fill(smallWidgetGradient)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
        }
        .configurationDisplayName("Grove")
        .description("Today's progress and your weekly garden.")
        .supportedFamilies([.systemSmall, .systemLarge])
        .contentMarginsDisabled()
        .containerBackgroundRemovable(false)
    }
}
