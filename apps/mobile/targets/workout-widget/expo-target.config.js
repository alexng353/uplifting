/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = () => ({
  type: "widget",
  name: "UpliftingWidget",
  bundleIdentifier: ".workout-widget",
  // ActivityContent and Text(timerInterval:) need iOS 16.2.
  deploymentTarget: "16.2",
  frameworks: ["SwiftUI", "WidgetKit", "ActivityKit"],
  colors: {
    $accent: "#F2894B",
    $widgetBackground: "#0B0B0D",
  },
});
