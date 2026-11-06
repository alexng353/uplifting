import ExpoModulesCore
import Foundation
import UIKit

// Must match plugins/withWorkoutIntents.js (the intents live in the app target).
private let intentNotification = Notification.Name("UpliftingIntent")
private let pendingIntentKey = "uplifting.pendingIntent"
private let pendingIntentAtKey = "uplifting.pendingIntentAt"

public class UpliftingLiveModule: Module {
  private var observers: [NSObjectProtocol] = []

  public func definition() -> ModuleDefinition {
    Name("UpliftingLive")

    Events("onIntent")

    OnCreate {
      let center = NotificationCenter.default
      self.observers.append(center.addObserver(forName: intentNotification, object: nil, queue: .main) { [weak self] note in
        guard let action = note.userInfo?["action"] as? String else { return }
        UserDefaults.standard.removeObject(forKey: pendingIntentKey)
        self?.sendEvent("onIntent", ["action": action])
      })
      self.observers.append(center.addObserver(forName: UIApplication.willTerminateNotification, object: nil, queue: nil) { _ in
        if #available(iOS 16.2, *) { WorkoutLiveActivity.endAllBlocking() }
      })
    }

    OnDestroy {
      self.observers.forEach { NotificationCenter.default.removeObserver($0) }
      self.observers.removeAll()
    }

    Function("isLiveActivitySupported") { () -> Bool in
      if #available(iOS 16.2, *) { return true }
      return false
    }

    Function("isWorkoutSessionSupported") { () -> Bool in
      if #available(iOS 26.0, *) { return true }
      return false
    }

    /// An intent that launched the app before JS was listening (within the last minute).
    Function("consumePendingIntent") { () -> String? in
      let defaults = UserDefaults.standard
      guard let action = defaults.string(forKey: pendingIntentKey) else { return nil }
      let at = defaults.double(forKey: pendingIntentAtKey)
      defaults.removeObject(forKey: pendingIntentKey)
      return Date().timeIntervalSince1970 - at < 60 ? action : nil
    }

    AsyncFunction("startOrUpdateActivity") { (workoutId: String, startMs: Double, state: [String: Any]) async -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      return await WorkoutLiveActivity.startOrUpdate(
        workoutId: workoutId,
        start: Date(timeIntervalSince1970: startMs / 1000),
        state: WorkoutLiveActivity.state(from: state))
    }

    AsyncFunction("endActivities") { (exceptWorkoutId: String?) async in
      guard #available(iOS 16.2, *) else { return }
      await WorkoutLiveActivity.endAll(except: exceptWorkoutId)
    }

    AsyncFunction("startWorkoutSession") { (workoutId: String, startMs: Double) async throws -> Bool in
      guard #available(iOS 26.0, *) else { return false }
      try await WorkoutSessionController.shared.start(
        workoutId: workoutId, startDate: Date(timeIntervalSince1970: startMs / 1000))
      return true
    }

    AsyncFunction("finishWorkoutSession") { (workoutId: String, endMs: Double) async throws -> [String: Any] in
      guard #available(iOS 26.0, *) else { return ["saved": false] }
      let controller = WorkoutSessionController.shared
      guard controller.isRunning, controller.workoutId == workoutId else { return ["saved": false] }
      return try await controller.finish(endDate: Date(timeIntervalSince1970: endMs / 1000))
    }

    Function("discardWorkoutSession") {
      if #available(iOS 26.0, *) { WorkoutSessionController.shared.discard() }
    }
  }
}
