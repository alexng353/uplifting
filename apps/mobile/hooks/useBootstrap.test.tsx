import { afterEach, expect, mock, test } from "bun:test";
import { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

let signedIn = false;
let finishBootstrap: () => void = () => {};
let fetches = 0;
mock.module("./useAuth", () => ({ useAuth: () => ({ isAuthenticated: signedIn }) }));
mock.module("../services/geolocation", () => ({ detectAndSetNearbyGym: async () => null }));
mock.module("../services/bootstrap", () => ({
  fetchBootstrapData: () => {
    fetches++;
    return new Promise<object>((resolve) => {
      finishBootstrap = () => resolve({});
    });
  },
  applyBootstrapData: () => {},
}));

const { useBootstrap } = await import("./useBootstrap");

/** Every render, as AuthGate would draw it: "app" means ActivityTracker and the Slot mount. */
const drawn: string[] = [];
function Gate() {
  const { isBootstrapped, isLoading } = useBootstrap();
  drawn.push(signedIn && isLoading && !isBootstrapped ? "spinner" : signedIn ? "app" : "login");
  return null;
}

let renderer: ReactTestRenderer;
afterEach(async () => {
  if (renderer) await act(() => renderer.unmount());
  drawn.length = 0;
  signedIn = false;
  fetches = 0;
});

test("signing in never draws the app before bootstrap finishes", async () => {
  await act(() => {
    renderer = create(<Gate />);
  });
  expect(drawn.every((d) => d === "login")).toBe(true);

  drawn.length = 0;
  signedIn = true;
  await act(() => renderer.update(<Gate />));
  expect(fetches).toBe(1);
  expect(drawn.length).toBeGreaterThan(0);
  expect(drawn.every((d) => d === "spinner")).toBe(true);

  await act(() => finishBootstrap());
  expect(drawn.at(-1)).toBe("app");
});

test("signing in again after a sign-out shows the spinner, not the old session's app", async () => {
  signedIn = true;
  await act(() => {
    renderer = create(<Gate />);
  });
  await act(() => finishBootstrap());
  expect(drawn.at(-1)).toBe("app");

  signedIn = false;
  await act(() => renderer.update(<Gate />));
  drawn.length = 0;
  signedIn = true;
  await act(() => renderer.update(<Gate />));
  expect(fetches).toBe(2);
  expect(drawn.every((d) => d === "spinner")).toBe(true);
});
