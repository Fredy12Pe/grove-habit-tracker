import WidgetKit
import SwiftUI

@main
struct GroveWidgetsBundle: WidgetBundle {
    var body: some Widget {
        GroveDailyStatusWidget()
        GroveWeeklyGrowthWidget()
    }
}
