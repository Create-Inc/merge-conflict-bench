import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read the resolved source as text
const source = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/create.jsx"),
  "utf-8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("imports - core React and React Native", () => {
    it("imports useCallback, useMemo, useState from react", () => {
      expect(source).toMatch(/useCallback/);
      expect(source).toMatch(/useMemo/);
      expect(source).toMatch(/useState/);
    });

    it("imports View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput from react-native", () => {
      expect(source).toMatch(/View/);
      expect(source).toMatch(/\bText\b/);
      expect(source).toMatch(/ScrollView/);
      expect(source).toMatch(/TouchableOpacity/);
      expect(source).toMatch(/ActivityIndicator/);
      expect(source).toMatch(/TextInput/);
    });

    it("imports StatusBar from expo-status-bar", () => {
      expect(source).toMatch(/StatusBar/);
    });

    it("imports useSafeAreaInsets from react-native-safe-area-context", () => {
      expect(source).toMatch(/useSafeAreaInsets/);
    });

    it("imports useRouter from expo-router", () => {
      expect(source).toMatch(/useRouter/);
    });
  });

  describe("imports - app utilities", () => {
    it("imports useAuth", () => {
      expect(source).toMatch(/useAuth/);
    });

    it("imports useColors and useTheme", () => {
      expect(source).toMatch(/useColors/);
      expect(source).toMatch(/useTheme/);
    });

    it("imports BrandLogo", () => {
      expect(source).toMatch(/BrandLogo/);
    });

    it("imports useViewerEmployee", () => {
      expect(source).toMatch(/useViewerEmployee/);
    });
  });

  describe("normalizeRole function", () => {
    it("defines normalizeRole function", () => {
      expect(source).toMatch(/function\s+normalizeRole/);
    });

    it("normalizes member to employee", () => {
      expect(source).toMatch(/["']member["'].*["']employee["']/s);
    });

    it("normalizes finance to manager", () => {
      expect(source).toMatch(/["']finance["'].*["']manager["']/s);
    });

    it("normalizes coordinator to employee", () => {
      expect(source).toMatch(/["']coordinator["'].*["']employee["']/s);
    });
  });

  describe("canCreateTradeShowsFromEmployee function", () => {
    it("defines canCreateTradeShowsFromEmployee", () => {
      expect(source).toMatch(/function\s+canCreateTradeShowsFromEmployee/);
    });

    it("allows admin and manager roles to create trade shows", () => {
      expect(source).toMatch(/["']admin["']/);
      expect(source).toMatch(/["']manager["']/);
    });
  });

  describe("createTradeShowApi function", () => {
    it("defines createTradeShowApi that POSTs to /api/tradeshows", () => {
      expect(source).toMatch(/createTradeShowApi/);
      expect(source).toMatch(/\/api\/tradeshows/);
      expect(source).toMatch(/method:\s*["']POST["']/);
    });
  });

  describe("CreateScreen component", () => {
    it("exports CreateScreen as default", () => {
      expect(source).toMatch(
        /export\s+default\s+function\s+CreateScreen/,
      );
    });
  });

  describe("form state", () => {
    it("initializes form with name, start_date, end_date, city, venue fields", () => {
      expect(source).toMatch(/name:\s*["']["']/);
      expect(source).toMatch(/start_date:\s*["']["']/);
      expect(source).toMatch(/end_date:\s*["']["']/);
      expect(source).toMatch(/city:\s*["']["']/);
      expect(source).toMatch(/venue:\s*["']["']/);
    });

    it("has task_template_id in form state", () => {
      expect(source).toMatch(/task_template_id/);
    });

    it("has saving and error state", () => {
      expect(source).toMatch(/saving.*setSaving/s);
      expect(source).toMatch(/error.*setError/s);
    });
  });

  describe("submission validation", () => {
    it("validates show name is required", () => {
      expect(source).toMatch(/Show name is required/);
    });

    it("validates start_date using usDateToIso", () => {
      expect(source).toMatch(/usDateToIso\(form\.start_date\)/);
    });

    it("validates end_date using usDateToIso", () => {
      expect(source).toMatch(/usDateToIso\(form\.end_date\)/);
    });
  });

  describe("navigation after creation", () => {
    it("navigates to /tradeshow/:id on success", () => {
      expect(source).toMatch(/router\.replace\(`\/tradeshow\/\$\{id\}`\)/);
    });

    it("falls back to /(tabs)/tradeshows if no id returned", () => {
      expect(source).toMatch(/router\.replace\(/);
      expect(source).toMatch(/tradeshows/);
    });
  });

  describe("handleBack navigation", () => {
    it("defines handleBack that uses router.canGoBack/back/replace", () => {
      expect(source).toMatch(/handleBack/);
      expect(source).toMatch(/canGoBack/);
      expect(source).toMatch(/router\.back\(\)/);
    });
  });

  describe("auth gate - sign in screen for unauthenticated users", () => {
    it("shows sign in button when not authenticated", () => {
      expect(source).toMatch(/Sign in/);
      expect(source).toMatch(/isAuthenticated/);
    });
  });

  describe("permission gate - shows message for unauthorized users", () => {
    it("shows permission denied message when canCreate is false", () => {
      expect(source).toMatch(/canCreate/);
    });
  });

  describe("UI - header with back button and Create show title", () => {
    it("renders Create show title", () => {
      expect(source).toMatch(/Create show/);
    });

    it("renders ArrowLeft back button", () => {
      expect(source).toMatch(/ArrowLeft/);
    });

    it("renders Plus icon in header", () => {
      expect(source).toMatch(/Plus/);
    });
  });

  describe("form inputs - city and venue", () => {
    it("has city input with Las Vegas placeholder", () => {
      expect(source).toMatch(/Las Vegas/);
    });

    it("has venue input with Convention Center placeholder", () => {
      expect(source).toMatch(/Convention Center/);
    });
  });

  describe("form - Create show submit button", () => {
    it("has a submit button that shows Create show or loading indicator", () => {
      // Submit button text
      expect(source).toMatch(/Create show/);
      // Loading indicator while saving
      expect(source).toMatch(/ActivityIndicator/);
    });
  });

  describe("form - error display", () => {
    it("displays error messages when error state is set", () => {
      expect(source).toMatch(/\{error\}/);
      expect(source).toMatch(/COLORS\.bad/);
    });
  });

  describe("payload - includes city and venue", () => {
    it("includes city and venue in the submission payload", () => {
      // The payload construction should reference city and venue
      expect(source).toMatch(/city:\s*String\(form\.city/);
      expect(source).toMatch(/venue:\s*String\(form\.venue/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("imports - Calendar from react-native-calendars", () => {
    it("imports Calendar from react-native-calendars", () => {
      expect(source).toMatch(/Calendar.*react-native-calendars/s);
    });
  });

  describe("imports - ChevronLeft, ChevronRight, X from lucide-react-native", () => {
    it("imports ChevronLeft", () => {
      expect(source).toMatch(/ChevronLeft/);
    });

    it("imports ChevronRight", () => {
      expect(source).toMatch(/ChevronRight/);
    });

    it("imports X icon", () => {
      expect(source).toMatch(/\bX\b/);
    });
  });

  describe("imports - useQuery, useMutation, useQueryClient from @tanstack/react-query", () => {
    it("imports useQuery", () => {
      expect(source).toMatch(/useQuery/);
    });

    it("imports useMutation", () => {
      expect(source).toMatch(/useMutation/);
    });

    it("imports useQueryClient", () => {
      expect(source).toMatch(/useQueryClient/);
    });
  });

  describe("imports - KeyboardAvoidingAnimatedView", () => {
    it("imports KeyboardAvoidingAnimatedView", () => {
      expect(source).toMatch(/KeyboardAvoidingAnimatedView/);
    });
  });

  describe("imports - Modal and Keyboard from react-native", () => {
    it("imports Modal from react-native", () => {
      expect(source).toMatch(/Modal/);
    });

    it("imports Keyboard from react-native", () => {
      expect(source).toMatch(/Keyboard/);
    });
  });

  describe("date helpers - pad2, normalizeUsDateInput, formatIsoToUsDate, isValidDateParts, usDateToIso", () => {
    it("defines pad2 function", () => {
      expect(source).toMatch(/function\s+pad2/);
    });

    it("defines normalizeUsDateInput function", () => {
      expect(source).toMatch(/function\s+normalizeUsDateInput/);
    });

    it("defines formatIsoToUsDate function", () => {
      expect(source).toMatch(/function\s+formatIsoToUsDate/);
    });

    it("defines isValidDateParts function", () => {
      expect(source).toMatch(/function\s+isValidDateParts/);
    });

    it("defines usDateToIso function", () => {
      expect(source).toMatch(/function\s+usDateToIso/);
    });
  });

  describe("calendar date picker - Modal for date selection", () => {
    it("uses dateKeyOpen state to track which date field is being picked", () => {
      expect(source).toMatch(/dateKeyOpen/);
    });

    it("has openDatePicker function", () => {
      expect(source).toMatch(/openDatePicker/);
    });

    it("has closePickerToType function to switch to typing mode", () => {
      expect(source).toMatch(/closePickerToType/);
    });

    it("renders Calendar component inside a Modal", () => {
      expect(source).toMatch(/Modal/);
      expect(source).toMatch(/<Calendar/);
    });

    it("Calendar has onDayPress handler", () => {
      expect(source).toMatch(/onDayPress/);
    });
  });

  describe("markedSingleDate helper for calendar", () => {
    it("defines markedSingleDate function", () => {
      expect(source).toMatch(/function\s+markedSingleDate/);
    });

    it("returns marked date config with selectedColor", () => {
      expect(source).toMatch(/selectedColor/);
    });
  });

  describe("fetchJson utility", () => {
    it("defines fetchJson function", () => {
      expect(source).toMatch(/function\s+fetchJson/);
    });
  });

  describe("template management - useQuery for templates", () => {
    it("queries task-templates via useQuery", () => {
      expect(source).toMatch(/queryKey.*task-templates/s);
    });

    it("derives templates list from query data", () => {
      expect(source).toMatch(/templatesQuery\.data/);
    });
  });

  describe("template navigation - prev/next cycling", () => {
    it("defines goPrevTemplate function", () => {
      expect(source).toMatch(/goPrevTemplate/);
    });

    it("defines goNextTemplate function", () => {
      expect(source).toMatch(/goNextTemplate/);
    });

    it("cycles through templates wrapping at boundaries", () => {
      // goPrevTemplate wraps to last item
      expect(source).toMatch(/templates\.length\s*-\s*1/);
    });
  });

  describe("template creation - inline Modal for creating templates", () => {
    it("has createTplOpen state for template creation modal", () => {
      expect(source).toMatch(/createTplOpen/);
    });

    it("has template name, description, and items state", () => {
      expect(source).toMatch(/tplName/);
      expect(source).toMatch(/tplDesc/);
      expect(source).toMatch(/tplItems/);
    });

    it("uses useMutation for creating templates via /api/task-templates", () => {
      expect(source).toMatch(/createTplMutation/);
      expect(source).toMatch(/\/api\/task-templates/);
    });

    it("on success, invalidates task-templates query and sets new template id", () => {
      expect(source).toMatch(/invalidateQueries.*task-templates/s);
    });
  });

  describe("inputStyle and labelStyle as memoized styles", () => {
    it("defines inputStyle", () => {
      expect(source).toMatch(/inputStyle/);
    });

    it("defines labelStyle", () => {
      expect(source).toMatch(/labelStyle/);
    });
  });

  describe("openWebPath import for web fallback", () => {
    it("imports openWebPath from @/utils/openWeb", () => {
      expect(source).toMatch(/openWebPath/);
    });
  });

  describe("date input - numeric keyboard type", () => {
    it("uses numeric keyboardType for date inputs", () => {
      expect(source).toMatch(/keyboardType/);
      expect(source).toMatch(/numeric/);
    });
  });

  describe("submission uses selectedTemplateId for task_template_id", () => {
    it("includes task_template_id from selectedTemplateId in payload", () => {
      expect(source).toMatch(/task_template_id:\s*selectedTemplateId/);
    });
  });

  describe("useRef for input refs", () => {
    it("imports useRef from react", () => {
      expect(source).toMatch(/useRef/);
    });

    it("uses inputRefs.current for managing focus", () => {
      expect(source).toMatch(/inputRefs/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" branch)
// =====================================================================
describe("theirs behaviors", () => {
  // The theirs branch introduced:
  // - UsDateField component for date inputs (extracted)
  // - TaskTemplateSelectorMobile component (extracted)
  // - KeyboardAvoidingView from RN (instead of custom animated one)
  // - Simpler code with extracted components
  //
  // The resolved version kept ours' approach (inline calendar, inline template management).
  // We test structural requirements that the resolution preserves from theirs.

  describe("form - start_date and end_date inputs", () => {
    it("has start date field", () => {
      expect(source).toMatch(/start_date/);
    });

    it("has end date field", () => {
      expect(source).toMatch(/end_date/);
    });
  });

  describe("form - trade show name input", () => {
    it("has trade show name input with CES 2026 placeholder", () => {
      expect(source).toMatch(/CES 2026/);
    });
  });

  describe("form - task_template_id field in form state", () => {
    it("includes task_template_id in initial form state", () => {
      expect(source).toMatch(/task_template_id:\s*["']["']/);
    });
  });

  describe("scroll view - keyboard should persist taps", () => {
    it("sets keyboardShouldPersistTaps=handled on ScrollView", () => {
      expect(source).toMatch(/keyboardShouldPersistTaps.*handled/s);
    });
  });

  describe("form inputs - consistent input styling", () => {
    it("input has height 46, borderRadius 12, fontSize 14", () => {
      expect(source).toMatch(/height:\s*46/);
      expect(source).toMatch(/borderRadius:\s*12/);
      expect(source).toMatch(/fontSize:\s*14/);
    });
  });

  describe("submit button styling", () => {
    it("submit button uses COLORS.brand background", () => {
      expect(source).toMatch(/backgroundColor:\s*COLORS\.brand/);
    });

    it("submit button has borderRadius 18 and height 52", () => {
      expect(source).toMatch(/borderRadius:\s*18/);
      expect(source).toMatch(/height:\s*52/);
    });
  });
});
