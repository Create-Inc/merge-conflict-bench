"use client";

import { useState } from "react";
import useUser from "@/utils/useUser";
import { useSMTPConfig } from "@/hooks/useSMTPConfig";
import { useSMTPTest } from "@/hooks/useSMTPTest";
import { useQuickFill } from "@/hooks/useQuickFill";
import { useBulkTest } from "@/hooks/useBulkTest";
import { Header } from "@/components/SMTPChecker/Header";
import { ServerSettings } from "@/components/SMTPChecker/ServerSettings";
import { Authentication } from "@/components/SMTPChecker/Authentication";
import { TestEmailSettings } from "@/components/SMTPChecker/TestEmailSettings";
import { AdvancedOptions } from "@/components/SMTPChecker/AdvancedOptions";
import { TestButton } from "@/components/SMTPChecker/TestButton";
import { TestResult } from "@/components/SMTPChecker/TestResult";
import { Footer } from "@/components/SMTPChecker/Footer";
import { QuickFillPanel } from "@/components/SMTPChecker/QuickFill/QuickFillPanel";

export default function SMTPChecker() {
  const { data: user, loading: userLoading } = useUser();
  const { config, setConfig, handleChange, canSubmit } = useSMTPConfig();
  const { testResult, testing, testConnection } = useSMTPTest();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    showQuickFill,
    setShowQuickFill,
    quickFillMode,
    setQuickFillMode,
    quickFillLine,
    setQuickFillLine,
    quickFillError,
    setQuickFillError,
    applyQuickFill,
  } = useQuickFill(config, setConfig);

  const {
    bulkLines,
    setBulkLines,
    bulkError,
    setBulkError,
    bulkResults,
    bulkRunning,
    bulkWorkingCount,
    bulkNotWorkingCount,
    bulkHasResults,
    bulkProgressText,
    handleBulkFile,
    startBulkTest,
    stopBulkTest,
  } = useBulkTest(config);

  const onBulkFileChange = (e) => {
    const file = e?.target?.files?.[0] || null;
    handleBulkFile(file);
  };

  if (userLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(40deg, #F9F6ED 0%, #F0F0F8 50%, #E7E9FB 100%)",
        }}
      >
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  // Logged out home screen: ONLY two buttons
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          background:
            "linear-gradient(40deg, #F9F6ED 0%, #F0F0F8 50%, #E7E9FB 100%)",
        }}
      >
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
            <h1 className="text-xl font-semibold text-slate-900">
              cashmike SMTP checker
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Choose a user to sign in
            </p>
          </div>

          <div className="p-6 space-y-3">
            <a
              href="/account/signin?callbackUrl=/&user=admin"
              className="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors"
            >
              Admin
            </a>
            <a
              href="/account/signin?callbackUrl=/&user=alonsy-y"
              className="block w-full text-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-lg text-sm transition-colors"
            >
              ALONSY-Y
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="font-inter min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(40deg, #F9F6ED 0%, #F0F0F8 50%, #E7E9FB 100%)",
      }}
    >
      <div className="w-full max-w-2xl mb-4 flex items-center justify-between">
        <div className="text-sm text-slate-700">
          Logged in as: <span className="font-semibold">{user.email}</span>
        </div>
        <div className="flex gap-2">
          {user.email === "admin@smtp-checker.local" && (
            <a
              href="/logs"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Logs
            </a>
          )}
          <a
            href="/account/logout"
            className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
          >
            Sign Out
          </a>
        </div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
        <Header />

        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                Server Settings
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowQuickFill((s) => !s);
                  setQuickFillError(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                {showQuickFill ? "Hide quick fill" : "Quick fill"}
              </button>
            </div>

            {showQuickFill ? (
              <QuickFillPanel
                quickFillMode={quickFillMode}
                setQuickFillMode={setQuickFillMode}
                quickFillLine={quickFillLine}
                setQuickFillLine={setQuickFillLine}
                applyQuickFill={applyQuickFill}
                quickFillError={quickFillError}
                setQuickFillError={setQuickFillError}
                bulkLines={bulkLines}
                setBulkLines={setBulkLines}
                bulkError={bulkError}
                setBulkError={setBulkError}
                bulkRunning={bulkRunning}
                bulkHasResults={bulkHasResults}
                bulkWorkingCount={bulkWorkingCount}
                bulkNotWorkingCount={bulkNotWorkingCount}
                bulkResults={bulkResults}
                bulkProgressText={bulkProgressText}
                onBulkFileChange={onBulkFileChange}
                startBulkTest={startBulkTest}
                stopBulkTest={stopBulkTest}
              />
            ) : null}

            <ServerSettings config={config} handleChange={handleChange} />
          </div>

          <Authentication config={config} handleChange={handleChange} />

          <TestEmailSettings config={config} handleChange={handleChange} />

          <AdvancedOptions
            config={config}
            handleChange={handleChange}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
          />

          <TestButton
            testing={testing}
            canSubmit={canSubmit}
            testConnection={() => testConnection(config)}
          />

          <TestResult testResult={testResult} showAdvanced={showAdvanced} />
        </div>

        <Footer />
      </div>

      <style jsx global>{`
        .font-inter {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI",
            "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans",
            "Droid Sans", "Helvetica Neue", sans-serif;
        }
      `}</style>
    </div>
  );
}
