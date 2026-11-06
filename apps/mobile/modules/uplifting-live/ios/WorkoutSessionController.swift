import Foundation
import HealthKit

/// A live HealthKit strength-training session (iOS 26+ on iPhone), so the workout counts
/// in Fitness while it runs and the builder saves it, with energy and heart rate, at Finish.
/// Main-actor isolated: start, finish, discard and the delegate callbacks never interleave
/// on the same state. JS also queues its calls (services/live-workout.ts).
@available(iOS 26.0, *)
@MainActor
final class WorkoutSessionController: NSObject, HKWorkoutSessionDelegate, HKLiveWorkoutBuilderDelegate {
  static let shared = WorkoutSessionController()

  private let store = HKHealthStore()
  private var session: HKWorkoutSession?
  private var builder: HKLiveWorkoutBuilder?
  private(set) var workoutId: String?

  var isRunning: Bool { session != nil }

  private func configuration() -> HKWorkoutConfiguration {
    let config = HKWorkoutConfiguration()
    config.activityType = .traditionalStrengthTraining
    config.locationType = .indoor
    return config
  }

  /// Starts (or keeps) the session for this workout. A session left running by a killed
  /// app is recovered when it is this workout's, and discarded when it is another's.
  func start(workoutId: String, startDate: Date) async throws {
    if session != nil, self.workoutId == workoutId { return }
    if session != nil { discard() }

    if await recoverMatching(workoutId) { return }

    let config = configuration()
    let session = try HKWorkoutSession(healthStore: store, configuration: config)
    let builder = session.associatedWorkoutBuilder()
    builder.dataSource = HKLiveWorkoutDataSource(healthStore: store, workoutConfiguration: config)
    adopt(session, workoutId: workoutId)
    session.startActivity(with: startDate)
    try await builder.beginCollection(at: startDate)
    try await builder.addMetadata([
      HKMetadataKeyExternalUUID: workoutId,
      HKMetadataKeyIndoorWorkout: true,
    ])
  }

  private func recover() async -> HKWorkoutSession? {
    await withCheckedContinuation { continuation in
      store.recoverActiveWorkoutSession { session, _ in continuation.resume(returning: session) }
    }
  }

  /// Adopts a surviving session if it was started for this workout; any other surviving
  /// session is ended without saving. True when one was adopted.
  private func recoverMatching(_ workoutId: String) async -> Bool {
    guard let recovered = await recover() else { return false }
    let owner = recovered.associatedWorkoutBuilder().metadata[HKMetadataKeyExternalUUID] as? String
    if owner == workoutId {
      adopt(recovered, workoutId: workoutId)
      return true
    }
    recovered.end()
    recovered.associatedWorkoutBuilder().discardWorkout()
    return false
  }

  private func adopt(_ session: HKWorkoutSession, workoutId: String) {
    self.session = session
    self.builder = session.associatedWorkoutBuilder()
    self.workoutId = workoutId
    session.delegate = self
    builder?.delegate = self
  }

  /// Ends the session and saves the workout to Health. Returns what Health measured.
  /// After a relaunch the session only lives in HealthKit, so it is recovered first.
  func finish(workoutId: String, endDate: Date) async throws -> [String: Any] {
    if session == nil || self.workoutId != workoutId {
      if session != nil { discard() }
      guard await recoverMatching(workoutId) else { return ["saved": false] }
    }
    guard let session, let builder else { return ["saved": false] }
    defer { reset() }
    session.stopActivity(with: endDate)
    session.end()
    try await builder.endCollection(at: endDate)
    let workout = try await builder.finishWorkout()

    var result: [String: Any] = ["saved": workout != nil]
    if let uuid = workout?.uuid.uuidString { result["healthWorkoutId"] = uuid }
    if let kcal = builder.statistics(for: HKQuantityType(.activeEnergyBurned))?.sumQuantity() {
      result["activeKcal"] = kcal.doubleValue(for: .kilocalorie())
    }
    let bpm = HKUnit.count().unitDivided(by: .minute())
    if let hr = builder.statistics(for: HKQuantityType(.heartRate)) {
      if let avg = hr.averageQuantity() { result["avgHeartRate"] = avg.doubleValue(for: bpm) }
      if let max = hr.maximumQuantity() { result["maxHeartRate"] = max.doubleValue(for: bpm) }
    }
    return result
  }

  /// Cancel: end the session without saving anything to Health.
  func discard() {
    session?.end()
    builder?.discardWorkout()
    reset()
  }

  /// Cancel after a relaunch: also end a session that only HealthKit still holds.
  func discardIncludingRecovered() async {
    if session != nil {
      discard()
      return
    }
    if let recovered = await recover() {
      recovered.end()
      recovered.associatedWorkoutBuilder().discardWorkout()
    }
  }

  private func reset() {
    session = nil
    builder = nil
    workoutId = nil
  }

  // MARK: delegates

  nonisolated func workoutSession(
    _ workoutSession: HKWorkoutSession, didChangeTo toState: HKWorkoutSessionState,
    from fromState: HKWorkoutSessionState, date: Date
  ) {}

  nonisolated func workoutSession(_ workoutSession: HKWorkoutSession, didFailWithError error: Error) {
    // Another app started a workout, or Health stopped ours. Uplifting's own workout keeps
    // running; Finish then falls back to saving a plain Health entry.
    Task { @MainActor in
      if workoutSession === self.session { self.reset() }
    }
  }

  nonisolated func workoutBuilder(_ workoutBuilder: HKLiveWorkoutBuilder, didCollectDataOf collectedTypes: Set<HKSampleType>) {}

  nonisolated func workoutBuilderDidCollectEvent(_ workoutBuilder: HKLiveWorkoutBuilder) {}
}
