<<<<<<< ours
import React from "react";
import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const onSignOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.error(err);
      setError("Could not sign out. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-inter flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        <div className="text-xs tracking-widest text-gray-500">FIRE OPS</div>
        <h1 className="mt-2 text-2xl font-semibold text-gray-800">Sign out</h1>
        <p className="mt-2 text-sm text-gray-600">
          This will sign you out of Fire Ops on this device.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSignOut}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
        >
          {loading ? "Signing out…" : "Sign out"}
        </button>

        <a
          href="/"
          className="mt-3 block text-center text-sm text-gray-600 underline"
        >
          Back to app
        </a>
      </div>
    </div>
  );
}
=======
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const { signOut } = useAuth();
  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Sign Out
        </h1>

        <button
          onClick={handleSignOut}
          className="w-full rounded-lg bg-[#357AFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default MainComponent;
>>>>>>> theirs
