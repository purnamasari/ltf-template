import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Stage } from "./components/Stage";
import { TermsProvider } from "./components/terms";
import { StaffAccessProvider } from "./components/StaffAccess";
import { useKioskBoot } from "./lib/boot";
import { useOutboxSync } from "./lib/outbox/useOutboxSync";
import { Cover } from "./screens/Cover";
import { Narration } from "./screens/Narration";
import { ChooseDesign } from "./screens/ChooseDesign";
import { Write } from "./screens/Write";
import { Preview } from "./screens/Preview";
import { YourName } from "./screens/YourName";
import { Delivery } from "./screens/Delivery";
import { Confirmation } from "./screens/Confirmation";
import { Sending } from "./screens/Sending";
import { ThankYou } from "./screens/ThankYou";
import { Pair } from "./screens/Pair";

/**
 * Boot and the outbox live above the flow: the queue drains whatever screen the
 * kiosk happens to be on, including while it sits on the cover overnight.
 */
function Root() {
  useKioskBoot();
  useOutboxSync();

  return (
    <Stage>
      <StaffAccessProvider>
        <TermsProvider>
          <Outlet />
        </TermsProvider>
      </StaffAccessProvider>
    </Stage>
  );
}

const rootRoute = createRootRoute({ component: Root });

/**
 * The narration remembers which beat it was on, so stepping back from the
 * design picker returns to the last line rather than replaying all three.
 */
const introRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intro",
  component: Narration,
  validateSearch: (search: Record<string, unknown>) => ({
    beat: Math.min(Math.max(Number(search.beat) || 0, 0), 2),
  }),
});

/** One route per screen of the flow, in the order a guest walks through it. */
const screens = [
  { path: "/", component: Cover },
  { path: "/design", component: ChooseDesign },
  { path: "/write", component: Write },
  { path: "/preview", component: Preview },
  { path: "/name", component: YourName },
  { path: "/delivery", component: Delivery },
  { path: "/confirm", component: Confirmation },
  { path: "/sending", component: Sending },
  { path: "/thank-you", component: ThankYou },
  { path: "/pair", component: Pair },
] as const;

const routeTree = rootRoute.addChildren([
  introRoute,
  ...screens.map(({ path, component }) =>
    createRoute({ getParentRoute: () => rootRoute, path, component }),
  ),
]);

export const router = createRouter({ routeTree, defaultPreload: false });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
