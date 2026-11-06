// SHARED-ATTRIBUTES-BEGIN
import ActivityKit
import Foundation

/// The Live Activity for a running workout. ActivityKit matches the app's and the
/// widget's copies by name and Codable shape, so the widget keeps an identical copy
/// (targets/workout-widget/UpliftingWorkoutAttributes.swift); a test keeps them equal.
@available(iOS 16.1, *)
struct UpliftingWorkoutAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// Current exercise, e.g. "Bench Press".
    var exercise: String
    /// e.g. "Set 3/4" ("Set 3" without a usual set count).
    var setLabel: String
    /// Last and target lifts, e.g. "Last 6×215 · Target 6×220 lbs".
    var detail: String
    /// The automatic rest timer, counting down from restStartedAt to restEndsAt.
    var restStartedAt: Date?
    var restEndsAt: Date?
  }

  var workoutId: String
  var workoutStart: Date
}
// SHARED-ATTRIBUTES-END
