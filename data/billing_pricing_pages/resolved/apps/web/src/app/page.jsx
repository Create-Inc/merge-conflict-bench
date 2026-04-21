"use client";

import {
  CheckCircle2,
  Sparkles,
  Plane,
  Users,
  DollarSign,
  Target,
  TrendingUp,
  MessageSquare,
  FileText,
  Smartphone,
  Globe,
  ArrowRight,
  CheckSquare,
  Building2,
  Zap,
  Play,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

export default function LandingPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const signupHref = "/account/signup?callbackUrl=%2Fdashboard";

  return (
    <div
      className={`min-h-screen ${colors.bg.primary} font-inter ${colors.text.primary} transition-colors duration-200`}
    >
      {/* Navigation */}
      <nav
        className={`border-b ${colors.border.primary} ${colors.bg.secondary} backdrop-blur-lg fixed w-full top-0 z-50 transition-colors duration-200`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#7C3AED] flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">TradeShow 360</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className={`text-sm ${colors.text.secondary} hover:${colors.text.primary} transition-colors hidden md:block`}
            >
              Features
            </a>
            <a
              href="#benefits"
              className={`text-sm ${colors.text.secondary} hover:${colors.text.primary} transition-colors hidden md:block`}
            >
              Benefits
            </a>
            <a
              href="/pricing"
              className={`text-sm ${colors.text.secondary} hover:${colors.text.primary} transition-colors hidden md:block`}
            >
              Pricing
            </a>
            <ThemeToggle />
            <a href={signupHref}>
              <button className="px-4 py-2 rounded-lg text-white bg-[#9333EA] hover:bg-[#7C3AED] text-sm font-semibold transition-colors">
                Start Free Trial
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#9333EA]/10 via-transparent to-[#7C3AED]/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#9333EA]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[120px]"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9333EA]/10 border border-[#9333EA]/30 text-[#9333EA] text-sm font-medium mb-6">
              <Sparkles size={16} />
              Exhibitor Command Center
            </div>
            <h1
              className={`text-5xl md:text-7xl font-bold mb-6 ${colors.text.primary}`}
            >
              Exhibit at Trade Shows
              <br />
              Like a Pro
            </h1>
            <p
              className={`text-xl ${colors.text.secondary} mb-8 max-w-2xl mx-auto leading-relaxed`}
            >
              The complete platform for exhibitors to plan every show, manage
              logistics, and improve ROI. Tasks, budgets, travel, contacts,
              inventory, and vendors — with built-in support and an optional
              concierge add-on.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href={signupHref}>
                <button className="flex items-center gap-2 px-8 py-4 rounded-lg text-white bg-gradient-to-r from-[#9333EA] to-[#7C3AED] hover:shadow-xl hover:shadow-[#9333EA]/20 text-base font-semibold transition-all">
                  Start Free Trial
                  <ArrowRight size={20} />
                </button>
              </a>
              <a href="#demo">
                <button
                  className={`px-8 py-4 rounded-lg ${colors.text.primary} border ${colors.border.primary} ${colors.bg.hover} text-base font-semibold transition-all`}
                >
                  Watch Demo
                </button>
              </a>
            </div>
            <div className={`mt-4 text-sm ${colors.text.tertiary}`}>
              No credit card required • 7-day free trial
            </div>
          </div>

          {/* Platform Badges */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <div className={`flex items-center gap-2 ${colors.text.secondary}`}>
              <Globe size={20} className="text-[#9333EA]" />
              <span className="text-sm font-medium">Web Platform</span>
            </div>
            <div className={`w-px h-6 ${colors.border.primary}`}></div>
            <div className={`flex items-center gap-2 ${colors.text.secondary}`}>
              <Smartphone size={20} className="text-[#9333EA]" />
              <span className="text-sm font-medium">Mobile App</span>
            </div>
          </div>

          {/* Hero Image / Screenshot */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-[#9333EA]/20 to-[#7C3AED]/20 rounded-2xl blur-3xl"></div>
            <div
              className={`relative ${colors.bg.tertiary} border ${colors.border.primary} rounded-2xl p-2 ${colors.shadow}`}
            >
              <div
                className={`${colors.bg.card} rounded-lg p-8 aspect-video flex items-center justify-center`}
              >
                <div className="text-center">
                  <FileText size={64} className="text-[#9333EA] mx-auto mb-4" />
                  <p className={colors.text.secondary}>Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-12 px-6 border-y ${colors.border.primary}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatBox number="10x" label="Faster Planning" />
          <StatBox number="100%" label="ROI Visibility" />
          <StatBox number="Unlimited" label="Seats" />
          <StatBox number="24/7" label="Support" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2
              className={`text-4xl md:text-5xl font-bold mb-4 ${colors.text.primary}`}
            >
              Everything You Need
            </h2>
            <p className={`text-lg ${colors.text.secondary}`}>
              Built for modern exhibitor teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={CheckSquare}
              title="Task Management"
              description="Create, assign, and track tasks with deadlines, priorities, and team collaboration."
              gradient="from-blue-600 to-cyan-600"
            />
            <FeatureCard
              icon={Target}
              title="Contact Capture"
              description="Capture and qualify contacts on-site with instant follow-up tracking and value estimation."
              gradient="from-green-600 to-emerald-600"
            />
            <FeatureCard
              icon={DollarSign}
              title="Budget Tracking"
              description="Monitor spending in real-time across categories with expense receipts and alerts."
              gradient="from-yellow-600 to-orange-600"
            />
            <FeatureCard
              icon={Plane}
              title="Travel Management"
              description="Track flights, hotels, and ground transportation with confirmation tracking."
              gradient="from-blue-600 to-cyan-600"
            />
            <FeatureCard
              icon={TrendingUp}
              title="ROI Analysis"
              description="Calculate true event ROI with revenue tracking and cost analysis."
              gradient="from-purple-600 to-pink-600"
            />
            <FeatureCard
              icon={Sparkles}
              title="360 Assistant"
              description="A quiet, intelligent layer that works in the background to keep your shows accurate and complete — reviewing uploaded or forwarded documents and flagging gaps early. Not a chatbot."
              gradient="from-violet-600 to-purple-600"
            />
            <FeatureCard
              icon={Users}
              title="Team Coordination"
              description="Assign roles, manage schedules, and keep everyone in sync."
              gradient="from-rose-600 to-red-600"
            />
            <FeatureCard
              icon={Building2}
              title="Vendor Management"
              description="Track contracts, invoices, and vendor relationships in one place."
              gradient="from-cyan-600 to-blue-600"
            />
            <FeatureCard
              icon={FileText}
              title="PDF Reports"
              description="Generate professional presentation packets with all your data."
              gradient="from-teal-600 to-green-600"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#9333EA]/20 to-[#7C3AED]/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-[#9333EA] to-[#7C3AED] rounded-3xl p-12 md:p-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                Ready to Level Up Your Next Event?
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Join exhibitor teams who plan smarter, execute better, and
                maximize ROI.
              </p>
              <a href={signupHref}>
                <button className="px-8 py-4 rounded-lg text-[#9333EA] bg-white hover:bg-gray-100 text-lg font-semibold transition-all inline-flex items-center gap-2">
                  Start Your Free Trial
                  <ArrowRight size={20} />
                </button>
              </a>
              <p className="text-sm text-white/70 mt-4">
                No credit card required • 7-day free trial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${colors.border.primary} py-12 px-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9333EA] to-[#7C3AED] flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold">TradeShow 360</span>
              </div>
              <p className={`text-sm ${colors.text.secondary}`}>
                The complete platform for exhibitors.
              </p>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${colors.text.primary}`}>
                Product
              </h4>
              <ul className={`space-y-2 text-sm ${colors.text.secondary}`}>
                <li>
                  <a href="#features" className={`hover:${colors.text.primary}`}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="/pricing" className={`hover:${colors.text.primary}`}>
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Mobile App
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${colors.text.primary}`}>
                Company
              </h4>
              <ul className={`space-y-2 text-sm ${colors.text.secondary}`}>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className={`font-semibold mb-4 ${colors.text.primary}`}>
                Support
              </h4>
              <ul className={`space-y-2 text-sm ${colors.text.secondary}`}>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className={`hover:${colors.text.primary}`}>
                    Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            className={`border-t ${colors.border.primary} pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm ${colors.text.secondary}`}
          >
            <p>© 2026 TradeShow 360. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className={`hover:${colors.text.primary}`}>
                Privacy
              </a>
              <a href="#" className={`hover:${colors.text.primary}`}>
                Terms
              </a>
              <a href="#" className={`hover:${colors.text.primary}`}>
                Security
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatBox({ number, label }) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-[#9333EA] mb-2">
        {number}
      </div>
      <div className={`text-sm ${colors.text.secondary}`}>{label}</div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, gradient, premium }) {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  return (
    <div
      className={`${colors.bg.card} border ${colors.border.primary} rounded-xl p-6 hover:border-[#9333EA]/50 transition-all group ${colors.shadow}`}
    >
      <div
        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon size={24} className="text-white" />
      </div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className={`text-lg font-semibold ${colors.text.primary}`}>
          {title}
        </h3>
      </div>
      <p className={`text-sm ${colors.text.secondary}`}>{description}</p>
    </div>
  );
}
