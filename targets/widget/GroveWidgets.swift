import SwiftUI
import WidgetKit

private let appGroupId = "group.com.groveHabits.app"
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

/// Small widget background gradient (README: #45A427 → #97C732)
private let smallWidgetGradient = LinearGradient(
    colors: [
        Color(red: 69 / 255, green: 164 / 255, blue: 39 / 255),
        Color(red: 151 / 255, green: 199 / 255, blue: 50 / 255),
    ],
    startPoint: .topLeading,
    endPoint: .bottomTrailing
)

private let groveGreen = Color(red: 0.271, green: 0.643, blue: 0.153)
/// Large widget plant strip (spec #F4F3E7)
private let weeklyPlantStripBg = Color(red: 244 / 255, green: 243 / 255, blue: 231 / 255)
private let dotOn = Color(red: 0.533, green: 0.749, blue: 0.145)
private let dotOff = Color(red: 0.682, green: 0.729, blue: 0.608)

// MARK: - Small daily widget layout (spec)

private enum SmallDailyWidgetMetrics {
    /// Circular progress ring outer bounds.
    static let ringSize: CGFloat = 76
    /// Tuned for ringSize (readable on systemSmall).
    static let ringStrokeWidth: CGFloat = 13
    static let ringTrailingInset: CGFloat = 21
    static let ringBottomInset: CGFloat = 18
    static let textTopInset: CGFloat = 16
    static let textLeadingInset: CGFloat = 16
    static let titleSubtitleSpacing: CGFloat = 2
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

// MARK: - Daily status

private struct DailyEntry: TimelineEntry {
    let date: Date
    let payload: DailyPayload
}

private struct DailyProvider: TimelineProvider {
    func placeholder(in _: Context) -> DailyEntry {
        DailyEntry(date: Date(), payload: DailyPayload(
            completedCount: 2,
            totalCount: 5,
            title: "Today's Habits",
            subtitle: "40% COMPLETED"
        ))
    }

    func getSnapshot(in _: Context, completion: @escaping (DailyEntry) -> Void) {
        completion(DailyEntry(date: Date(), payload: decodeDaily()))
    }

    func getTimeline(in _: Context, completion: @escaping (Timeline<DailyEntry>) -> Void) {
        let entry = DailyEntry(date: Date(), payload: decodeDaily())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

/// Circular ring (see `ringSize`); track white 50% / fill white 100%; center `habit-progress-icon`.
/// Inner layout is `ringSize - stroke` so strokes are not clipped; 100% uses a full circle (no trim gap).
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

/// Small card: ZStack — text top-leading 16/16; Sprout bottom-leading; ring bottom-trailing 21/18.
private struct DailyStatusView: View {
    let payload: DailyPayload

    private var progress: Double {
        guard payload.totalCount > 0 else { return 0 }
        return min(1, max(0, Double(payload.completedCount) / Double(payload.totalCount)))
    }

    /// Mirrors `titleVariant` in lib/widgets/syncWidgets.ts so subtext always matches the ring.
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

struct GroveDailyStatusWidget: Widget {
    let kind: String = "GroveDailyStatusWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyProvider()) { entry in
            DailyStatusView(payload: entry.payload)
                .widgetURL(habitsDeepLink)
                .containerBackground(for: .widget) {
                    RoundedRectangle(cornerRadius: 21.67, style: .continuous)
                        .fill(smallWidgetGradient)
                }
        }
        .configurationDisplayName("Today's Habits")
        .description("Shows today's habit completion at a glance.")
        .supportedFamilies([.systemSmall])
        .contentMarginsDisabled()
    }
}

// MARK: - Weekly growth

private struct WeeklyEntry: TimelineEntry {
    let date: Date
    let payload: WeeklyPayload
}

private struct WeeklyProvider: TimelineProvider {
    func placeholder(in _: Context) -> WeeklyEntry {
        WeeklyEntry(date: Date(), payload: WeeklyPayload(
            title: "Your garden is growing",
            subtitle: "0 of 0 habits completed",
            days: (0 ..< 7).map { WeeklyPayload.DayItem(iso: "", completed: $0 % 2 == 0) },
            plants: []
        ))
    }

    func getSnapshot(in _: Context, completion: @escaping (WeeklyEntry) -> Void) {
        completion(WeeklyEntry(date: Date(), payload: decodeWeekly()))
    }

    func getTimeline(in _: Context, completion: @escaping (Timeline<WeeklyEntry>) -> Void) {
        let entry = WeeklyEntry(date: Date(), payload: decodeWeekly())
        completion(Timeline(entries: [entry], policy: .never))
    }
}

private struct PlantThumb: View {
    let plantIndex: Int
    let frameIndex: Int
    let outer: CGFloat
    let image: CGFloat

    var body: some View {
        let name = "plant_\(plantIndex)_\(frameIndex)"
        ZStack {
            Image(name)
                .resizable()
                .scaledToFit()
                .frame(width: image, height: image)
        }
        .frame(width: outer, height: outer)
    }
}

private struct WeeklyContent: View {
    let payload: WeeklyPayload

    private let plantOuter: CGFloat = 64
    private let plantImage: CGFloat = 54
    private let perRow = 4
    private let rowGap: CGFloat = 10
    private let plantStripHeight: CGFloat = 182
    private let plantStripBottomCorner: CGFloat = 21.67

    private var plantStripShape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(
            cornerRadii: RectangleCornerRadii(
                topLeading: 0,
                bottomLeading: plantStripBottomCorner,
                bottomTrailing: plantStripBottomCorner,
                topTrailing: 0
            ),
            style: .continuous
        )
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(payload.title)
                        .font(.system(size: 20, weight: .semibold))
                        .foregroundStyle(.white)
                    Text(payload.subtitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.white.opacity(0.7))
                }

                HStack(spacing: 6) {
                    ForEach(Array(payload.days.enumerated()), id: \.offset) { _, d in
                        Circle()
                            .fill(d.completed ? dotOn : dotOff)
                            .frame(width: 6, height: 6)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
            .padding(.horizontal, 16)
            .padding(.top, 16)

            Spacer(minLength: 0)

            VStack(spacing: 0) {
                Spacer(minLength: 0)
                VStack(alignment: .leading, spacing: rowGap) {
                    let rows = stride(from: 0, to: payload.plants.count, by: perRow).map {
                        Array(payload.plants[$0 ..< min($0 + perRow, payload.plants.count)])
                    }
                    ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                        HStack(spacing: rowGap) {
                            ForEach(row, id: \.habitId) { p in
                                PlantThumb(
                                    plantIndex: p.plantIndex,
                                    frameIndex: p.frameIndex,
                                    outer: plantOuter,
                                    image: plantImage
                                )
                            }
                        }
                    }
                }
                .padding(.horizontal, 12)
                Spacer(minLength: 0)
            }
            .frame(maxWidth: .infinity)
            .frame(height: plantStripHeight)
            .background {
                plantStripShape.fill(weeklyPlantStripBg)
            }
            .clipShape(plantStripShape)
        }
    }
}

private struct WeeklyWidgetView: View {
    let entry: WeeklyEntry

    var body: some View {
        WeeklyContent(payload: entry.payload)
            .widgetURL(habitsDeepLink)
            .containerBackground(for: .widget) {
                groveGreen
            }
    }
}

struct GroveWeeklyGrowthWidget: Widget {
    let kind: String = "GroveWeeklyGrowthWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WeeklyProvider()) { entry in
            WeeklyWidgetView(entry: entry)
        }
        .configurationDisplayName("Weekly Growth")
        .description("Shows your plants growing through the week.")
        .supportedFamilies([.systemLarge])
        .contentMarginsDisabled()
    }
}
