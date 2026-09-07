# Simulator testing

Use native development builds for this project. Do not use Expo Go; it is not
compatible with this project's native dependencies.

For iOS, run `bun mobile ios` or run `bunx expo run:ios --device <simulator-udid>`
from `apps/mobile`. Use Metro with the installed native build for subsequent
JavaScript changes.
