"use client";

import { useState, useEffect } from "react";
import { CheckCircle, ChevronRight } from "lucide-react";
import useUser from "@/utils/useUser";

export default function OnboardingPage() {
  const { data: user, loading: userLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    pattySize: "",
    defaultQuantity: "",
    profileNotes: "",
    termsAccepted: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      // Use callbackUrl (Auth.js standard)
      window.location.href = "/account/signin?callbackUrl=/onboarding";
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        pattySize: user.patty_size_g?.toString() || "",
        defaultQuantity: user.default_quantity?.toString() || "",
        profileNotes: user.profile_notes || "",
      }));

      // If user already accepted terms, redirect to home
      if (user.terms_accepted_at) {
        window.location.href = "/";
      }
    }
  }, [user, userLoading]);

  const steps = [
    {
      title: "Welcome to Burger Head",
      description: "Let's get your profile set up",
    },
    {
      title: "Your Details",
      description: "Tell us a bit about yourself",
    },
    {
      title: "Preferences",
      description: "Set your default preferences",
    },
    {
      title: "Terms & Conditions",
      description: "Review and accept our terms",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError("Please enter your name");
        return;
      }
    }

    if (currentStep === 2) {
      if (formData.pattySize && isNaN(Number(formData.pattySize))) {
        setError("Patty size must be a number");
        return;
      }
      if (formData.defaultQuantity && isNaN(Number(formData.defaultQuantity))) {
        setError("Default quantity must be a number");
        return;
      }
    }

    if (currentStep === 3) {
      if (!formData.termsAccepted) {
        setError("Please accept the terms and conditions to continue");
        return;
      }
      handleSubmit();
      return;
    }

    setCurrentStep((prev) => prev + 1);
    setError(null);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          patty_size_g: formData.pattySize
            ? parseInt(formData.pattySize)
            : null,
          default_quantity: formData.defaultQuantity
            ? parseInt(formData.defaultQuantity)
            : null,
          profile_notes: formData.profileNotes,
          terms_accepted: formData.termsAccepted,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      // Redirect to home after successful onboarding
      window.location.href = "/";
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] dark:bg-[#121212]">
        <div className="text-lg text-[#5D667E] dark:text-[#B0B0B0]">
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7FAFC] dark:bg-[#121212]">
        <div className="text-center">
          <div className="text-lg text-[#5D667E] dark:text-[#B0B0B0] mb-4">
            Redirecting to sign in...
          </div>
          <a
            href="/account/signin?callbackUrl=/onboarding"
            className="text-[#FFCD00] hover:underline"
          >
            Click here if not redirected
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAFC] dark:bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      index < currentStep
                        ? "bg-[#FFCD00] border-[#FFCD00] text-black"
                        : index === currentStep
                          ? "border-[#FFCD00] text-[#FFCD00] dark:text-[#FFCD00]"
                          : "border-[#E4E8EE] dark:border-[#333333] text-[#9DA5BC] dark:text-[#888888]"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle size={20} />
                    ) : (
                      <span className="font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center hidden sm:block">
                    <p
                      className={`text-xs font-medium ${
                        index <= currentStep
                          ? "text-[#1F2739] dark:text-[#FFFFFF]"
                          : "text-[#9DA5BC] dark:text-[#888888]"
                      }`}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStep
                        ? "bg-[#FFCD00]"
                        : "bg-[#E4E8EE] dark:bg-[#333333]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-[#1E1E1E] border border-[#E4E8EE] dark:border-[#333333] rounded-xl p-8 shadow-lg">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center">
              <img
                src="https://ucarecdn.com/1b86880c-5c4b-4e3d-bd65-ae0ad30b87d1/-/format/auto/"
                alt="Burger Head"
                className="h-24 w-24 object-contain mx-auto mb-6"
              />
              <h1 className="text-3xl font-bold text-[#1F2739] dark:text-[#FFFFFF] mb-4">
                Welcome to Burger Head!
              </h1>
              <p className="text-lg text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                Burgers that taste good
              </p>
              <p className="text-lg font-semibold text-[#FFCD00] mb-8">
                and do good
              </p>
              <p className="text-[#5D667E] dark:text-[#B0B0B0] mb-8">
                Let's get your account set up so you can start managing your
                food truck operations efficiently.
              </p>
            </div>
          )}

          {/* Step 1: Your Details */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                Your Details
              </h2>
              <p className="text-[#5D667E] dark:text-[#B0B0B0] mb-6">
                Tell us a bit about yourself
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg bg-white dark:bg-[#1E1E1E] text-[#1F2739] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg bg-[#F7FAFC] dark:bg-[#121212] text-[#9DA5BC] dark:text-[#888888] cursor-not-allowed"
                  />
                  <p className="text-xs text-[#9DA5BC] dark:text-[#888888] mt-1">
                    Your email cannot be changed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                Set Your Preferences
              </h2>
              <p className="text-[#5D667E] dark:text-[#B0B0B0] mb-6">
                These can be changed later in your profile settings
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                    Default Patty Size (grams)
                  </label>
                  <input
                    type="number"
                    value={formData.pattySize}
                    onChange={(e) =>
                      handleInputChange("pattySize", e.target.value)
                    }
                    placeholder="e.g., 150"
                    className="w-full px-4 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg bg-white dark:bg-[#1E1E1E] text-[#1F2739] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  />
                  <p className="text-xs text-[#9DA5BC] dark:text-[#888888] mt-1">
                    Used for mince calculations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                    Default Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.defaultQuantity}
                    onChange={(e) =>
                      handleInputChange("defaultQuantity", e.target.value)
                    }
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg bg-white dark:bg-[#1E1E1E] text-[#1F2739] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  />
                  <p className="text-xs text-[#9DA5BC] dark:text-[#888888] mt-1">
                    Default order quantity for calculations
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#5D667E] dark:text-[#B0B0B0] mb-2">
                    Profile Notes (Optional)
                  </label>
                  <textarea
                    value={formData.profileNotes}
                    onChange={(e) =>
                      handleInputChange("profileNotes", e.target.value)
                    }
                    placeholder="Any additional notes about your preferences..."
                    rows={4}
                    className="w-full px-4 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg bg-white dark:bg-[#1E1E1E] text-[#1F2739] dark:text-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#FFCD00]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Terms & Conditions */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                Terms & Conditions
              </h2>
              <p className="text-[#5D667E] dark:text-[#B0B0B0] mb-6">
                Please review and accept our terms to continue
              </p>

              <div className="bg-[#F7FAFC] dark:bg-[#121212] border border-[#E4E8EE] dark:border-[#333333] rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-[#1F2739] dark:text-[#FFFFFF] mb-4">
                  Burger Head Terms of Service
                </h3>
                <div className="space-y-4 text-sm text-[#5D667E] dark:text-[#B0B0B0]">
                  <p>
                    Welcome to Burger Head's food truck management system. By
                    using this platform, you agree to the following terms:
                  </p>

                  <div>
                    <h4 className="font-medium text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                      1. Account Usage
                    </h4>
                    <p>
                      You are responsible for maintaining the confidentiality of
                      your account credentials and for all activities that occur
                      under your account.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                      2. Data Privacy
                    </h4>
                    <p>
                      We collect and process your data in accordance with our
                      Privacy Policy. Your information is used solely for
                      operational purposes and will not be shared with third
                      parties without your consent.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                      3. Service Availability
                    </h4>
                    <p>
                      While we strive to maintain 24/7 availability, we do not
                      guarantee uninterrupted access to the platform. Scheduled
                      maintenance will be communicated in advance when possible.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                      4. Acceptable Use
                    </h4>
                    <p>
                      You agree to use this platform only for lawful purposes
                      and in accordance with these terms. Any misuse may result
                      in account suspension or termination.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-[#1F2739] dark:text-[#FFFFFF] mb-2">
                      5. Changes to Terms
                    </h4>
                    <p>
                      We reserve the right to modify these terms at any time.
                      Continued use of the platform after changes constitutes
                      acceptance of the new terms.
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) =>
                    handleInputChange("termsAccepted", e.target.checked)
                  }
                  className="mt-1 w-5 h-5 rounded border-[#E4E8EE] dark:border-[#333333] text-[#FFCD00] focus:ring-[#FFCD00]"
                />
                <span className="text-sm text-[#5D667E] dark:text-[#B0B0B0]">
                  I have read and agree to the Terms & Conditions and Privacy
                  Policy
                </span>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 py-3 border border-[#E4E8EE] dark:border-[#333333] rounded-lg text-[#5D667E] dark:text-[#B0B0B0] hover:bg-[#F7FAFC] dark:hover:bg-[#2A2A2A] transition-colors font-medium disabled:opacity-50"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 py-3 bg-[#FFCD00] hover:bg-[#FFD700] text-black rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Saving..."
              ) : currentStep === steps.length - 1 ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
