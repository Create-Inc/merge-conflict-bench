<<<<<<< ours
import { ArrowLeft } from "lucide-react";

export function PageNotFound({ orderedPages }) {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <a
          href="/documentation/admin-manual"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Manual
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-6">
          Page not found
        </h1>
        <p className="text-gray-600 mt-2">That manual page doesn't exist.</p>
        <div className="mt-6">
          <div className="font-semibold text-gray-900">Try one of these:</div>
          <div className="mt-3 grid gap-2">
            {orderedPages.slice(0, 8).map((p) => (
              <a
                key={p.slug}
                href={`/documentation/admin-manual/${p.slug}`}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                {p.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
=======
import { ArrowLeft } from "lucide-react";

export function PageNotFound({ orderedPages }) {
  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <a
          href="/documentation/admin-manual"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin Manual
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-6">
          Page not found
        </h1>
        <p className="text-gray-600 mt-2">
          That admin manual page doesn’t exist.
        </p>
        <div className="mt-6">
          <div className="font-semibold text-gray-900">Try one of these:</div>
          <div className="mt-3 grid gap-2">
            {orderedPages.slice(0, 10).map((p) => (
              <a
                key={p.slug}
                href={`/documentation/admin-manual/${p.slug}`}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                {p.title}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> theirs
