## Ownership

This codebase is yours: what it's for and how it's built are your call, and you'll keep building on it.
Keep user-visible behaviour, wire formats and public APIs as they are unless the task asks to change them; put refactors in their own commit, and name every behaviour change in your final report.

# Simulator testing

Use native development builds for this project. Do not use Expo Go; it is not
compatible with this project's native dependencies.

For iOS, run `bun mobile ios` or run `bunx expo run:ios --device <simulator-udid>`
from `apps/mobile`. Use Metro with the installed native build for subsequent
JavaScript changes.
