export default function SignUpDisabledPage() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(40deg, #F9F6ED 0%, #F0F0F8 50%, #E7E9FB 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Sign up is disabled
        </h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          This app uses pre-made accounts only.
        </p>
        <a
          href="/"
          className="block w-full text-center rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
        >
          Go to home
        </a>
      </div>
    </div>
  );
}
