"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import PricingRequestModal from "@/components/PricingRequestModal";
import { getBrandLogo, getHiResLogoUrl } from "@/utils/logoHelpers";

export default function PricingPage() {
  const [showRequestForm, setShowRequestForm] = useState(false);

  const brandLogo = getBrandLogo();
  const logoUrl = getHiResLogoUrl(brandLogo) || brandLogo;

  const features = [
    "Complete inventory tracking from arrival to sale",
    "Custom workflow steps tailored to your dealership",
    "Work order management and vendor coordination",
    "Sales board with customer tracking",
    "Delivery calendar and task scheduling",
    "Document management and scanning",
    "Team collaboration and notifications",
    "DMS integration (Frazer, DealerCenter, and more)",
    "Mobile app for iOS and Android",
    "Unlimited support and training",
    "Regular updates and new features included",
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Simple Pricing
          </h1>
          {/* remove the subtitle under the title */}
        </div>

        {/* Main pricing card */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="border-2 border-blue-600 rounded-xl p-8 shadow-lg bg-white">
            <div className="text-center mb-6">
              {/* replace text logo with the blue Lotly logo */}
              <div className="flex items-center justify-center">
                <img
                  src={logoUrl}
                  alt="Lotly Auto"
                  className="h-10 w-auto"
                  style={{ maxWidth: 180 }}
                />
              </div>

              <div className="mt-4 flex flex-col items-center justify-center gap-1">
                <div className="text-sm text-gray-600">Plans range from</div>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold text-gray-900">
                    $250–$650
                  </span>
                  <span className="text-gray-600 text-lg">/ month</span>
                </div>
              </div>

              {/* remove the extra text below the pricing */}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Everything Included:
              </h3>
              <ul className="space-y-2.5">
                {features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-700"
                  >
                    <Check className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setShowRequestForm(true)}
              className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            >
              Request Custom Pricing
            </button>

            {/* remove the footer text under the button */}
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                No Contracts
              </div>
              <div className="text-sm text-gray-600 mt-1">Cancel anytime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                All Features
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Everything included — no add-ons
              </div>
            </div>
<<<<<<< ours

=======
            {/* removed the "Guided Setup" box */}
>>>>>>> theirs
          </div>
        </div>
      </div>

      <PricingRequestModal
        isOpen={showRequestForm}
        onClose={() => setShowRequestForm(false)}
      />
    </div>
  );
}
