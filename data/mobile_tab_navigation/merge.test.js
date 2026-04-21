import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read all resolved source files as text for structural pattern testing
const layoutSource = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/(tabs)/_layout.jsx"),
  "utf-8",
);

const homeQuickLinksSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/mobile/src/components/HomeScreen/QuickLinksSection.jsx",
  ),
  "utf-8",
);

const welcomeQuickLinksSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/mobile/src/components/WelcomeScreen/QuickLinksSection.jsx",
  ),
  "utf-8",
);

const iconSource = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/ui/icons/Icon.jsx"),
  "utf-8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("_layout.jsx - tab screens defined", () => {
    it("defines all five main tab screens: dashboard, calendar, horses, chat, profile", () => {
      expect(layoutSource).toMatch(/name="dashboard"/);
      expect(layoutSource).toMatch(/name="calendar"/);
      expect(layoutSource).toMatch(/name="horses"/);
      expect(layoutSource).toMatch(/name="chat"/);
      expect(layoutSource).toMatch(/name="profile"/);
    });

    it("defines hidden tabs: home, welcome, today, incidents, shifts", () => {
      expect(layoutSource).toMatch(/name="home".*href:\s*null/s);
      expect(layoutSource).toMatch(/name="welcome".*href:\s*null/s);
      expect(layoutSource).toMatch(/name="today".*href:\s*null/s);
      expect(layoutSource).toMatch(/name="incidents".*href:\s*null/s);
      expect(layoutSource).toMatch(/name="shifts".*href:\s*null/s);
    });
  });

  describe("_layout.jsx - TabIconWrap component", () => {
    it("defines a TabIconWrap function that takes focused and children", () => {
      expect(layoutSource).toMatch(
        /function\s+TabIconWrap\s*\(\s*\{\s*focused\s*,\s*children\s*\}\s*\)/,
      );
    });

    it("uses Animated for scale and glow animation", () => {
      expect(layoutSource).toMatch(/Animated\.timing/);
      expect(layoutSource).toMatch(/transform:\s*\[\s*\{\s*scale\s*\}/);
    });
  });

  describe("_layout.jsx - badge counts", () => {
    it("imports useBadgeCounts hook", () => {
      expect(layoutSource).toMatch(/useBadgeCounts/);
    });

    it("dashboard badge combines ownerUpdates + timeExceptions + incidents", () => {
      expect(layoutSource).toMatch(
        /counts\.ownerUpdates\s*\+\s*counts\.timeExceptions\s*\+\s*counts\.incidents/,
      );
    });

    it("chat tab has badge for messages count", () => {
      expect(layoutSource).toMatch(/counts\.messages\s*>\s*0/);
    });

    it("profile tab shows charges badge only for OWNER role", () => {
      expect(layoutSource).toMatch(/userRole\s*===\s*["']OWNER["']/);
      expect(layoutSource).toMatch(/counts\.charges/);
    });
  });

  describe("_layout.jsx - fetches user profile on mount", () => {
    it("fetches /api/profile and sets userRole and userProfile", () => {
      expect(layoutSource).toMatch(/\/api\/profile/);
      expect(layoutSource).toMatch(/setUserRole/);
      expect(layoutSource).toMatch(/setUserProfile/);
    });
  });

  describe("QuickLinksSection - both HomeScreen and WelcomeScreen", () => {
    for (const [name, source] of [
      ["HomeScreen", homeQuickLinksSource],
      ["WelcomeScreen", welcomeQuickLinksSource],
    ]) {
      describe(`${name}/QuickLinksSection`, () => {
        it("includes horses, calendar, alerts, and chat quick links", () => {
          expect(source).toMatch(/key:\s*["']horses["']/);
          expect(source).toMatch(/key:\s*["']calendar["']/);
          expect(source).toMatch(/key:\s*["']alerts["']/);
          expect(source).toMatch(/key:\s*["']chat["']/);
        });

        it("adds staff link for MANAGER role", () => {
          expect(source).toMatch(/role\s*===\s*["']MANAGER["']/);
          expect(source).toMatch(/key:\s*["']staff["']/);
        });

        it("adds tasks link for OWNER role", () => {
          expect(source).toMatch(/role\s*===\s*["']OWNER["']/);
          expect(source).toMatch(/key:\s*["']tasks["']/);
        });

        it("renders items in 2-column rows", () => {
          expect(source).toMatch(/flexDirection:\s*["']row["']/);
          expect(source).toMatch(/items\.slice\(i,\s*i\s*\+\s*2\)/);
        });
      });
    }
  });

  describe("Icon.jsx - handles horse icon specially", () => {
    it("has special handling for horse icon name", () => {
      expect(iconSource).toMatch(/name\s*===\s*["']horse["']/);
    });
  });

  describe("Icon.jsx - exports Icon as named or default export", () => {
    it("exports Icon function", () => {
      expect(iconSource).toMatch(/export\s+(default\s+)?function\s+Icon/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("_layout.jsx - imports StatusBar from expo-status-bar", () => {
    it("imports StatusBar", () => {
      expect(layoutSource).toMatch(/import\s*\{.*StatusBar.*\}\s*from\s*["']expo-status-bar["']/);
    });

    it("renders StatusBar with style light", () => {
      expect(layoutSource).toMatch(/<StatusBar\s+style="light"/);
    });
  });

  describe("_layout.jsx - wraps Tabs in Fragment (<>)", () => {
    it("uses Fragment wrapper (due to StatusBar being a sibling)", () => {
      expect(layoutSource).toMatch(/<>/);
      expect(layoutSource).toMatch(/<\/>/);
    });
  });

  describe("_layout.jsx - tab bar uses UI.bg background", () => {
    it("sets backgroundColor to UI.bg", () => {
      expect(layoutSource).toMatch(/backgroundColor:\s*UI\.bg/);
    });
  });

  describe("_layout.jsx - tab bar uses UI.brass for active tint", () => {
    it("uses UI.brass for tabBarActiveTintColor", () => {
      expect(layoutSource).toMatch(/tabBarActiveTintColor:\s*UI\.brass/);
    });
  });

  describe("_layout.jsx - tab icons use UI.brass color", () => {
    it("passes UI.brass as color to Icon components", () => {
      expect(layoutSource).toMatch(/color=\{UI\.brass\}/);
    });
  });

  describe("_layout.jsx - glow uses UI.brass backgroundColor", () => {
    it("uses UI.brass for glow background color", () => {
      expect(layoutSource).toMatch(/backgroundColor:\s*UI\.brass/);
    });
  });

  describe("_layout.jsx - glow uses interpolated glowOpacity", () => {
    it("uses glowOpacity variable for the glow overlay", () => {
      expect(layoutSource).toMatch(/glowOpacity/);
    });
  });

  describe("Icon.jsx - uses Ionicons from @expo/vector-icons", () => {
    it("imports Ionicons from @expo/vector-icons/Ionicons", () => {
      expect(iconSource).toMatch(
        /import\s+Ionicons\s+from\s*["']@expo\/vector-icons\/Ionicons["']/,
      );
    });
  });

  describe("Icon.jsx - IONICON_NAME_MAP covers all original icon names", () => {
    it("maps alertTriangle to warning-outline", () => {
      expect(iconSource).toMatch(/alertTriangle.*warning-outline/s);
    });

    it("maps messageCircle to chatbubble-outline", () => {
      expect(iconSource).toMatch(/messageCircle.*chatbubble-outline/s);
    });

    it("maps users to people-outline", () => {
      expect(iconSource).toMatch(/users.*people-outline/s);
    });

    it("maps clipboardList to clipboard-outline", () => {
      expect(iconSource).toMatch(/clipboardList.*clipboard-outline/s);
    });

    it("maps layoutGrid to grid-outline", () => {
      expect(iconSource).toMatch(/layoutGrid.*grid-outline/s);
    });

    it("maps user (singular) to person-outline", () => {
      // The key may or may not be quoted; use word boundary to avoid matching 'users'
      expect(iconSource).toMatch(/\buser\b[^s].*person-outline/);
    });
  });

  describe("Icon.jsx - horse icon renders custom SVG", () => {
    it("renders Svg and Path for horse", () => {
      expect(iconSource).toMatch(/Svg/);
      expect(iconSource).toMatch(/Path/);
    });
  });

  describe("QuickLinksSection - uses ours icon names", () => {
    it("HomeScreen uses alertTriangle for alerts", () => {
      expect(homeQuickLinksSource).toMatch(
        /key:\s*["']alerts["'].*iconName:\s*["']alertTriangle["']/s,
      );
    });

    it("HomeScreen uses messageCircle for chat", () => {
      expect(homeQuickLinksSource).toMatch(
        /key:\s*["']chat["'].*iconName:\s*["']messageCircle["']/s,
      );
    });

    it("HomeScreen uses users for staff", () => {
      expect(homeQuickLinksSource).toMatch(
        /key:\s*["']staff["'].*iconName:\s*["']users["']/s,
      );
    });

    it("HomeScreen uses clipboardList for tasks", () => {
      expect(homeQuickLinksSource).toMatch(
        /key:\s*["']tasks["'].*iconName:\s*["']clipboardList["']/s,
      );
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" branch)
// =====================================================================
describe("theirs behaviors", () => {
  // Note: theirs introduced new icon names (alerts, chat, staff, tasks)
  // and lucide-react-native Icon registry.
  // The resolved version chose to keep ours's Icon system (Ionicons).
  // The key theirs behavioral requirements are tested via the patterns
  // that were NOT adopted (we test what the resolution DID preserve from theirs).

  // From theirs: the UI.brass import and Icon import were moved below other imports.
  // The resolved version still uses UI and Icon from the same modules.
  describe("_layout.jsx - imports UI and Icon", () => {
    it("imports UI from ../../ui/ui", () => {
      expect(layoutSource).toMatch(
        /import\s*\{.*UI.*\}\s*from\s*["']\.\.\/\.\.\/ui\/ui["']/,
      );
    });

    it("imports Icon from ../../ui/icons", () => {
      expect(layoutSource).toMatch(
        /import\s*\{.*Icon.*\}\s*from\s*["']\.\.\/\.\.\/ui\/icons["']/,
      );
    });
  });

  describe("_layout.jsx - tab bar shows labels", () => {
    it("has tabBarShowLabel: true", () => {
      expect(layoutSource).toMatch(/tabBarShowLabel:\s*true/);
    });

    it("has tabBarLabelStyle with fontSize 11", () => {
      expect(layoutSource).toMatch(/fontSize:\s*11/);
    });
  });

  describe("_layout.jsx - tab bar has border and padding", () => {
    it("uses borderTopWidth: 1 and borderTopColor: UI.border1", () => {
      expect(layoutSource).toMatch(/borderTopWidth:\s*1/);
      expect(layoutSource).toMatch(/borderTopColor:\s*UI\.border1/);
    });

    it("has paddingTop: 6", () => {
      expect(layoutSource).toMatch(/paddingTop:\s*6/);
    });
  });
});
