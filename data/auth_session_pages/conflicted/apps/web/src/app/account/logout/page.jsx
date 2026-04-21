<<<<<<< ours
import useAuth from "@/utils/useAuth";
import designSystem from "@/design-system";

export default function LogoutPage() {
  const { signOut } = useAuth();
  const ds = designSystem;

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className="min-h-screen w-full font-inter flex items-center justify-center px-4 py-10"
      style={{ background: ds.colors.white, color: ds.colors.black }}
    >
      <div
        className="w-full max-w-md bg-white border-2 rounded-lg p-8"
        style={{
          borderColor: ds.colors.black,
          boxShadow: ds.shadows.offsetLarge,
        }}
      >
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span
              className="text-5xl font-space-grotesk font-bold"
              style={{
                color: ds.colors.yellow,
                WebkitTextStroke: `2px ${ds.colors.black}`,
              }}
            >
              03
            </span>
            <div>
              <div
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: ds.colors.gray[500] }}
              >
                Account
              </div>
              <div
                className="h-[2px] w-14 mt-2"
                style={{ background: ds.colors.black }}
              ></div>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-space-grotesk font-bold">
            Sign out
          </h1>
          <p className="mt-2 text-sm" style={{ color: ds.colors.gray[700] }}>
            You’ll be sent back to the homepage.
          </p>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full border-2 rounded-lg px-4 py-3 font-space-grotesk font-bold text-base transition-all duration-200"
          style={{
            background: ds.colors.yellow,
            borderColor: ds.colors.black,
            boxShadow: ds.shadows.offsetLarge,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-2px, -2px)";
            e.currentTarget.style.boxShadow = ds.shadows.offsetXL;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = ds.shadows.offsetLarge;
          }}
        >
          Sign out
        </button>

        <div className="mt-5 text-center">
          <a
            href="/jobs"
            className="text-sm font-semibold underline"
            style={{ color: ds.colors.blue }}
          >
            Back to jobs
          </a>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@300;400;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
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
