import ActivityKit
import Foundation
import UIKit

/// Starts, updates and ends the workout Live Activity. Only local updates; no push.
@available(iOS 16.2, *)
enum WorkoutLiveActivity {
  // Content older than this shows as stale; the system ends any activity after 8 h.
  private static let staleAfter: TimeInterval = 3 * 60 * 60

  static func state(from dict: [String: Any]) -> UpliftingWorkoutAttributes.ContentState {
    func date(_ key: String) -> Date? {
      guard let ms = dict[key] as? Double else { return nil }
      return Date(timeIntervalSince1970: ms / 1000)
    }
    return .init(
      exercise: dict["exercise"] as? String ?? "Workout",
      setLabel: dict["setLabel"] as? String ?? "",
      detail: dict["detail"] as? String ?? "",
      restStartedAt: date("restStartedAt"),
      restEndsAt: date("restEndsAt"),
      title: (dict["title"] as? String).flatMap { $0.isEmpty ? nil : $0 },
      superset: (dict["superset"] as? String).flatMap { $0.isEmpty ? nil : $0 })
  }

  static var current: [Activity<UpliftingWorkoutAttributes>] {
    Activity<UpliftingWorkoutAttributes>.activities
  }

  /// Starts the activity for this workout, or updates it if it is already up.
  static func startOrUpdate(workoutId: String, start: Date, state: UpliftingWorkoutAttributes.ContentState) async -> Bool {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return false }
    let content = ActivityContent(state: state, staleDate: Date().addingTimeInterval(staleAfter))
    var found = false
    for activity in current {
      if activity.attributes.workoutId == workoutId, activity.activityState == .active || activity.activityState == .stale {
        found = true
        await activity.update(content)
      } else {
        // Left over from another workout (e.g. the app was killed): drop it now.
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
    if found { return true }
    do {
      _ = try Activity.request(
        attributes: UpliftingWorkoutAttributes(workoutId: workoutId, workoutStart: start),
        content: content,
        pushType: nil)
      return true
    } catch {
      return false
    }
  }

  static func endAll(except workoutId: String? = nil) async {
    for activity in current where activity.attributes.workoutId != workoutId {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
  }

  /// Called on willTerminate: end everything before the process goes, so a killed app
  /// does not leave a frozen workout on the Lock Screen.
  static func endAllBlocking(timeout: TimeInterval = 2) {
    let done = DispatchSemaphore(value: 0)
    Task.detached {
      await endAll()
      done.signal()
    }
    _ = done.wait(timeout: .now() + timeout)
  }
}
