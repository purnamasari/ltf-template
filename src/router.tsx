import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";
import { Stage } from "./components/kiosk/Stage";
import { TermsProvider } from "./components/kiosk/terms";
import { FlowProgress } from "./components/kiosk/FlowProgress";
import { StaffAccessProvider } from "./components/kiosk/StaffAccess";
import { useKioskBoot } from "./lib/boot";
import { useOutboxSync } from "./lib/outbox/useOutboxSync";
import { Cover } from "./screens/kiosk/Cover";
import { Narration } from "./screens/kiosk/Narration";
import { ChooseDesign } from "./screens/kiosk/ChooseDesign";
import { Write } from "./screens/kiosk/Write";
import { Preview } from "./screens/kiosk/Preview";
import { YourName } from "./screens/kiosk/YourName";
import { Delivery } from "./screens/kiosk/Delivery";
import { Confirmation } from "./screens/kiosk/Confirmation";
import { Sending } from "./screens/kiosk/Sending";
import { ThankYou } from "./screens/kiosk/ThankYou";
import { Pair } from "./screens/kiosk/Pair";
import { Story } from "./screens/preview/Story";

/**
 * Two surfaces share this bundle and have almost nothing in common.
 *
 * The kiosk is the tablet in the hotel: a fixed 1194 x 834 frame, scaled to fit,
 * nothing scrolling, a flow the guest is walked through. The preview is the link
 * the recipient opens years later, on a phone or a laptop, and is responsive in
 * the ordinary way. So the root holds neither: it is a bare outlet, and each
 * surface brings its own layout route.
 */
function Root() {
  const story = useRouterState({
    select: (state) => state.location.pathname.startsWith("/story"),
  });

  return story ? <Outlet /> : <KioskShell />;
}

/**
 * Boot and the outbox live above the flow: the queue drains whatever screen the
 * kiosk happens to be on, including while it sits on the cover overnight. Both
 * belong to the kiosk alone — opening the preview link must not pair a device
 * or drain anyone's outbox.
 */
function KioskShell() {
  useKioskBoot();
  useOutboxSync();

  return (
    <Stage>
      <StaffAccessProvider>
        <TermsProvider>
          <Outlet />
          {/* Above the routes so it survives the navigation and can animate. */}
          <FlowProgress />
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
  { path: "/name", component: YourName },
  { path: "/design", component: ChooseDesign },
  { path: "/write", component: Write },
  { path: "/preview", component: Preview },
  { path: "/delivery", component: Delivery },
  { path: "/confirm", component: Confirmation },
  { path: "/sending", component: Sending },
  { path: "/thank-you", component: ThankYou },
  { path: "/pair", component: Pair },
] as const;

/** The recipient's surface. Outside the kiosk layout: no Stage, no progress. */
const storyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/story",
  component: Story,
});

const routeTree = rootRoute.addChildren([
  introRoute,
  ...screens.map(({ path, component }) =>
    createRoute({ getParentRoute: () => rootRoute, path, component }),
  ),
  storyRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: false });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
