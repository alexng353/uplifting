// iOS 27 SDK builds stop at launch unless the app adopts the UIScene lifecycle.
// Expo SDK 54 (and the SDK 57 template) still create the window in the app delegate,
// so this plugin moves window creation into a scene delegate during prebuild.
const fs = require("fs");
const path = require("path");
const {
  IOSConfig,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require("expo/config-plugins");

const SCENE_DELEGATE = `import UIKit
import React

// Created by plugins/withSceneLifecycle.js; edit the plugin, not this file.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      fatalError("SceneDelegate: AppDelegate has no React Native factory; check plugins/withSceneLifecycle.js")
    }
    let window = UIWindow(windowScene: windowScene)
    self.window = window

    // iOS may drop a background scene and connect a new one in the same process.
    // Move the running React root over instead of starting a second app.
    if let rootViewController = appDelegate.window?.rootViewController {
      appDelegate.window?.rootViewController = nil
      window.rootViewController = rootViewController
      appDelegate.window = window
      window.makeKeyAndVisible()
      return
    }

    appDelegate.window = window
    // With scenes, a cold-start link is not in the launch options; put it back so
    // Linking.getInitialURL() sees it.
    var launchOptions = appDelegate.launchOptions ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    if let activity = connectionOptions.userActivities.first {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ] as [AnyHashable: Any]
    }
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)

    // Also hand them to the app delegate, where expo-router's linking subscriber listens.
    for context in connectionOptions.urlContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: openOptions(context))
    }
    for activity in connectionOptions.userActivities {
      _ = appDelegate.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    for context in URLContexts {
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: openOptions(context))
    }
  }

  private func openOptions(_ context: UIOpenURLContext) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [
      .openInPlace: context.options.openInPlace,
    ]
    if let source = context.options.sourceApplication { options[.sourceApplication] = source }
    if let annotation = context.options.annotation { options[.annotation] = annotation }
    return options
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate else { return }
    _ = appDelegate.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  // UIKit stops sending these to the app delegate once scenes are adopted; Expo
  // modules subscribe through it, so forward them.
  func sceneDidBecomeActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidBecomeActive?(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillResignActive?(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationDidEnterBackground?(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    UIApplication.shared.delegate?.applicationWillEnterForeground?(UIApplication.shared)
  }
}
`;

const WINDOW_BLOCK =
  /window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*factory\.startReactNative\(\s*withModuleName: "main",\s*in: window,\s*launchOptions: launchOptions\)/;
const FACTORY_VAR = "var reactNativeFactory: RCTReactNativeFactory?";
const MARKER = "SceneDelegate starts React Native";

function patchAppDelegate(contents) {
  if (contents.includes(MARKER)) return contents;
  // Fail the prebuild rather than ship an app that silently never starts.
  if (!WINDOW_BLOCK.test(contents) || !contents.includes(FACTORY_VAR)) {
    throw new Error(
      "withSceneLifecycle: AppDelegate.swift no longer matches the expected template",
    );
  }
  return contents
    .replace(
      FACTORY_VAR,
      `${FACTORY_VAR}\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?`,
    )
    .replace(
      WINDOW_BLOCK,
      `// ${MARKER} once its window scene connects.\n    self.launchOptions = launchOptions`,
    );
}

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: "Default Configuration",
        UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
      },
    ],
  },
};

const withSceneLifecycle = (config) => {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    return cfg;
  });

  config = withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== "swift") {
      throw new Error("withSceneLifecycle: expected a Swift AppDelegate");
    }
    cfg.modResults.contents = patchAppDelegate(cfg.modResults.contents);
    return cfg;
  });

  config = withDangerousMod(config, [
    "ios",
    (cfg) => {
      const name = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
      fs.writeFileSync(
        path.join(cfg.modRequest.platformProjectRoot, name, "SceneDelegate.swift"),
        SCENE_DELEGATE,
      );
      return cfg;
    },
  ]);

  config = withXcodeProject(config, (cfg) => {
    const name = IOSConfig.XcodeUtils.getProjectName(cfg.modRequest.projectRoot);
    const filepath = `${name}/SceneDelegate.swift`;
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

module.exports = withSceneLifecycle;
module.exports.patchAppDelegate = patchAppDelegate;
module.exports.SCENE_MANIFEST = SCENE_MANIFEST;
