"use client";

import { useState } from "react";

export default function LYFAcademyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    athleteName: "",
    athleteGradYear: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/services/lyf-academy/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Enrollment failed");
      }

      const { enrollmentId } = await res.json();

      const checkoutRes = await fetch("/api/parent/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId }),
      });

      if (!checkoutRes.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await checkoutRes.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#cc0000] via-[#b30000] to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA2KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img
                src="https://ucarecdn.com/5380eb8a-7d96-4358-bfa9-da4ad22eeb9e/-/format/auto/"
                alt="Our Vision"
                className="h-20 md:h-24"
              />
            </div>

            {/* Removed the star icon badge under the logo */}

            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-3">
              LYF Academy
            </h1>

            <p className="text-lg md:text-xl text-white/90 font-semibold mb-6">
              <span>
                <strong>L</strong>eading <strong>Y</strong>outh{" "}
                <strong>F</strong>orward
              </span>
            </p>

            <p className="text-lg md:text-2xl text-white/90 font-medium mb-6">
              A Clear Plan for Student-Athlete Success — On and Off the Field
            </p>

            <div className="max-w-3xl mx-auto text-left md:text-center">
              <p className="text-base md:text-lg text-white/85 mb-4">
                LYF Academy is a year-long student-athlete success program
                designed to guide families through academics, athletics,
                recruiting education, and personal development with structure,
                accountability, and expert support.
              </p>

              <p className="text-base md:text-lg text-white/85 mb-6">
                This program is a comprehensive development and education
                program for student-athletes and their families who want
                clarity, consistency, and a proven roadmap for long-term
                success.
              </p>

              <p className="text-base md:text-lg text-white/90 font-semibold mb-4">
                This is not just recruiting help — it is a structured system
                that supports:
              </p>

              <div className="text-base md:text-lg text-white/85 max-w-3xl mx-auto">
                <ul className="space-y-2">
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Academic readiness</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Athletic development</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Family education</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Accountability and guidance</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-white flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Long-term planning</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Included Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-[#cc0000]/10 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#cc0000]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Monthly Coaching Sessions
            </h3>
            <p className="text-gray-600">
              One-on-one coaching, personalized feedback, and progress tracking
              every month.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-[#cc0000]/10 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#cc0000]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Life Skills Curriculum
            </h3>
            <p className="text-gray-600">
              Academic structure, time management, mental discipline, and
              character development.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
            <div className="w-12 h-12 bg-[#cc0000]/10 rounded-xl flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#cc0000]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-black mb-3">
              Recruiting Education
            </h3>
            <p className="text-gray-600">
              Navigate the college recruiting process with confidence and
              knowledge.
            </p>
          </div>
        </div>

        {/* Enrollment Form */}
        <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-black mb-2 text-center">
            Enroll Today
          </h2>
          <p className="text-gray-600 text-center mb-2">
            <span className="text-3xl font-extrabold text-[#cc0000]">
              $400/month
            </span>
          </p>
          <p className="text-gray-500 text-center mb-8 text-sm">
            12-month commitment • Billed monthly • Includes all program benefits
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Parent Info */}
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                Parent Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Name *
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="Min. 8 characters"
                  />
                </div>
              </div>
            </div>

            {/* Athlete Info */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-black mb-4">
                Athlete Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Athlete Full Name *
                  </label>
                  <input
                    type="text"
                    name="athleteName"
                    value={formData.athleteName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="Jordan Smith"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Graduation Year *
                  </label>
                  <input
                    type="number"
                    name="athleteGradYear"
                    value={formData.athleteGradYear}
                    onChange={handleChange}
                    required
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-transparent"
                    placeholder="2026"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#cc0000] hover:bg-[#b30000] disabled:bg-gray-200 disabled:text-gray-500 text-white font-bold rounded-lg transition-colors duration-200 text-lg"
            >
              {loading ? "Processing..." : "Enroll & Pay $400/month →"}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By enrolling, you agree to our Terms of Service and Privacy
              Policy. Your first payment of $400 will be processed immediately
              upon enrollment confirmation.
            </p>
          </form>
        </div>

        {/* Additional Trust Section */}
        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-white/90 text-sm">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Secure payment processing via Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
