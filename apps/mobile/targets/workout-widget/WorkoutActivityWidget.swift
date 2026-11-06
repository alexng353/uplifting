import ActivityKit
import SwiftUI
import WidgetKit

// Ember theme, as in the redesign (design-system.html).
private enum Ember {
  static let accent = Color(red: 0xF2 / 255, green: 0x89 / 255, blue: 0x4B / 255)
  static let background = Color(red: 0x0B / 255, green: 0x0B / 255, blue: 0x0D / 255)
  static let text = Color(white: 0.96)
  static let muted = Color(white: 0.62)
}

private extension UpliftingWorkoutAttributes.ContentState {
  /// The rest window, while it hasn't run out. Text(timerInterval:) ticks without updates.
  var rest: ClosedRange<Date>? {
    guard let start = restStartedAt, let end = restEndsAt, end > start, end > Date() else { return nil }
    return start...end
  }
}

/// Rest countdown while resting, otherwise the workout clock.
private struct ClockText: View {
  let state: UpliftingWorkoutAttributes.ContentState
  let workoutStart: Date

  var body: some View {
    if let rest = state.rest {
      Text(timerInterval: rest, countsDown: true)
        .foregroundStyle(Ember.accent)
    } else {
      Text(workoutStart, style: .timer)
        .foregroundStyle(Ember.text)
    }
  }
}

private struct LockScreenView: View {
  let context: ActivityViewContext<UpliftingWorkoutAttributes>

  var body: some View {
    let state = context.state
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 4) {
        HStack(spacing: 6) {
          Image(systemName: "dumbbell.fill").foregroundStyle(Ember.accent)
          Text(state.exercise).font(.headline).foregroundStyle(Ember.text).lineLimit(1)
        }
        Text(state.setLabel).font(.subheadline.weight(.semibold)).foregroundStyle(Ember.accent)
        if let superset = state.superset {
          HStack(spacing: 4) {
            Image(systemName: "arrow.left.arrow.right").font(.caption2)
            Text(superset).font(.caption.weight(.medium)).lineLimit(1)
          }
          .foregroundStyle(Ember.text)
        }
        if !state.detail.isEmpty {
          Text(state.detail).font(.caption).foregroundStyle(Ember.muted).lineLimit(1)
        }
      }
      Spacer(minLength: 8)
      VStack(alignment: .trailing, spacing: 2) {
        Text(state.rest != nil ? "REST" : (state.title ?? "Workout").uppercased())
          .font(.caption2.weight(.bold)).foregroundStyle(Ember.muted)
        ClockText(state: state, workoutStart: context.attributes.workoutStart)
          .font(.system(size: 30, weight: .bold, design: .rounded).monospacedDigit())
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: 120, alignment: .trailing)
        if state.rest != nil {
          Text(context.attributes.workoutStart, style: .timer)
            .font(.caption.monospacedDigit()).foregroundStyle(Ember.muted)
            .multilineTextAlignment(.trailing)
            .frame(maxWidth: 120, alignment: .trailing)
        }
      }
    }
    .padding(16)
    .opacity(context.isStale ? 0.5 : 1)
    .activityBackgroundTint(Ember.background)
    .activitySystemActionForegroundColor(Ember.accent)
  }
}

struct WorkoutActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: UpliftingWorkoutAttributes.self) { context in
      LockScreenView(context: context)
    } dynamicIsland: { context in
      let state = context.state
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(state.exercise).font(.headline).foregroundStyle(Ember.text).lineLimit(1)
            Text(state.setLabel).font(.subheadline.weight(.semibold)).foregroundStyle(Ember.accent)
          }
          .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing, spacing: 2) {
            Text(state.rest != nil ? "REST" : (state.title ?? "Workout").uppercased())
              .font(.caption2.weight(.bold)).foregroundStyle(Ember.muted)
            ClockText(state: state, workoutStart: context.attributes.workoutStart)
              .font(.title2.weight(.bold).monospacedDigit())
              .multilineTextAlignment(.trailing)
              .frame(maxWidth: 100, alignment: .trailing)
          }
          .padding(.trailing, 4)
        }
        DynamicIslandExpandedRegion(.bottom) {
          if let superset = state.superset {
            Text(superset).font(.caption.weight(.medium)).foregroundStyle(Ember.text).lineLimit(1)
          } else if !state.detail.isEmpty {
            Text(state.detail).font(.caption).foregroundStyle(Ember.muted).lineLimit(1)
          }
        }
      } compactLeading: {
        Image(systemName: "dumbbell.fill").foregroundStyle(Ember.accent)
      } compactTrailing: {
        ClockText(state: state, workoutStart: context.attributes.workoutStart)
          .font(.caption.weight(.semibold).monospacedDigit())
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: 52)
      } minimal: {
        if state.rest != nil {
          ClockText(state: state, workoutStart: context.attributes.workoutStart)
            .font(.caption2.monospacedDigit())
            .multilineTextAlignment(.center)
            .frame(maxWidth: 36)
        } else {
          Image(systemName: "dumbbell.fill").foregroundStyle(Ember.accent)
        }
      }
      .keylineTint(Ember.accent)
    }
  }
}
