import { expect, test } from "bun:test";

const { patchAppDelegate } = require("./withSceneLifecycle");

// The relevant lines of the AppDelegate that Expo SDK 54 prebuild writes.
const SDK54 = `  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

test("moves window creation out of the app delegate, once", () => {
  const out = patchAppDelegate(SDK54);
  expect(out).not.toContain("UIWindow(frame:");
  expect(out).not.toContain("factory.startReactNative");
  expect(out).toContain("var launchOptions: [UIApplication.LaunchOptionsKey: Any]?");
  expect(out).toContain("self.launchOptions = launchOptions");
  expect(patchAppDelegate(out)).toBe(out);
});

test("fails the prebuild when the template changes", () => {
  expect(() => patchAppDelegate("class AppDelegate {}")).toThrow(/no longer matches/);
});
