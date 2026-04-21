import {
  ArrowLeft,
  ArrowRight,
  Activity,
  Bot,
  BookOpen,
  Building2,
  CreditCard,
  Gauge,
  Lock,
  Plug,
  ScrollText,
  Shield,
  Users,
} from "lucide-react";
import { LAST_UPDATED, WHO_FOR } from "../data/constants";

const ICON_MAP = {
  Activity,
  Bot,
  BookOpen,
  Building2,
  CreditCard,
  Gauge,
  Lock,
  Plug,
  ScrollText,
  Shield,
  Users,
};

export function PageHeader({ page }) {
  const IconComponent = page.icon ? ICON_MAP[page.icon.name] || Shield : Shield;

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <a
          href="/documentation/admin-manual"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Manual
        </a>
        <a
          href="/documentation"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          Documentation
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>

      <div className="mt-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-full text-sm font-medium">
          <IconComponent className="w-4 h-4" />
          Admin Manual
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mt-5">
          {page.title}
        </h1>
        <p className="text-lg text-gray-600 mt-4">{page.summary}</p>

        <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Who this is for</div>
              <div className="mt-1">{WHO_FOR}</div>
            </div>
            <div className="text-sm text-gray-700">
              <div className="font-semibold text-gray-900">Last updated</div>
              <div className="mt-1">{LAST_UPDATED}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
