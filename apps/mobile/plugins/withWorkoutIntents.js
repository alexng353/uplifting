// Adds Uplifting's App Intents (Start / Finish Workout for Siri, Shortcuts and the Action
// button) to the app target. App Intents must be compiled into the app itself for iOS
// to find them, so they can't live in the Expo module pod. They hand the action to
// modules/uplifting-live through NotificationCenter, plus a UserDefaults copy for a cold
// launch before JS is listening.
const fs = require("fs");
const path = require("path");
const { IOSConfig, withDangerousMod, withXcodeProject } = require("expo/config-plugins");

const FILE = "UpliftingIntents.swift";

const INTENTS = `import AppIntents
import Foundation

// Created by plugins/withWorkoutIntents.js; edit the plugin, not this file.
@available(iOS 16.0, *)
enum UpliftingIntentInbox {
  static func post(_ action: String) {
    let defaults = UserDefaults.standard
    defaults.set(action, forKey: "uplifting.pendingIntent")
    defaults.set(Date().timeIntervalSince1970, forKey: "uplifting.pendingIntentAt")
    NotificationCenter.default.post(
      name: Notification.Name("UpliftingIntent"), object: nil, userInfo: ["action": action])
  }
}

@available(iOS 16.0, *)
struct StartUpliftingWorkoutIntent: AppIntent {
  static var title: LocalizedStringResource = "Start Workout"
  static var description = IntentDescription("Starts a strength workout in Uplifting.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    UpliftingIntentInbox.post("start")
    return .result()
  }
}

@available(iOS 16.0, *)
struct FinishUpliftingWorkoutIntent: AppIntent {
  static var title: LocalizedStringResource = "Finish Workout"
  static var description = IntentDescription("Opens the summary to finish the workout in Uplifting.")
  static var openAppWhenRun: Bool = true

  @MainActor
  func perform() async throws -> some IntentResult {
    UpliftingIntentInbox.post("finish")
    return .result()
  }
}

@available(iOS 16.0, *)
struct UpliftingShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: StartUpliftingWorkoutIntent(),
      phrases: ["Start a workout in \\(.applicationName)", "Start \\(.applicationName)"])
    AppShortcut(
      intent: FinishUpliftingWorkoutIntent(),
      phrases: ["Finish my workout in \\(.applicationName)", "Finish \\(.applicationName)"])
  }
}
`;

const withWorkoutIntents = (config) => {
  config = withDangerousMod(config, [
    "ios",
    (cfg) => {
      const name = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
      fs.writeFileSync(path.join(cfg.modRequest.platformProjectRoot, name, FILE), INTENTS);
      return cfg;
    },
  ]);
  config = withXcodeProject(config, (cfg) => {
    const name = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const filepath = `${name}/${FILE}`;
    if (!cfg.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: name,
        project: cfg.modResults,
      });
    }
    return cfg;
  });
  return config;
};

module.exports = withWorkoutIntents;
module.exports.INTENTS = INTENTS;
