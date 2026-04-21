<<<<<<< ours
import { Shield } from "lucide-react";
import { Section } from "./Section";

export function PageContent({ sections, backToTopOnClick }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="font-semibold text-gray-900">Content coming soon</div>
        <p className="text-sm text-gray-600 mt-2">
          This page is wired up and ready for content. Tell me what you want
          this section to cover and I'll write it.
        </p>
      </div>
    );
  }

  return (
    <>
      {sections.map((s) => {
        const SIcon = s.icon || Shield;
        const body = s.body;
        return (
          <Section
            key={s.id}
            id={s.id}
            title={s.title}
            icon={SIcon}
            backToTopOnClick={backToTopOnClick}
          >
            {body}
          </Section>
        );
      })}
    </>
  );
}
=======
import { BookOpen } from "lucide-react";
import { Section } from "./Section";

export function PageContent({ sections, backToTopOnClick }) {
  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="font-semibold text-gray-900">Content coming soon</div>
        <p className="text-sm text-gray-600 mt-2">
          This page is wired up and ready for content. Tell me what you want
          this section to cover and I&apos;ll write it.
        </p>
      </div>
    );
  }

  return (
    <>
      {sections.map((s) => {
        const SIcon = s.icon || BookOpen;
        const body = s.body;
        return (
          <Section
            key={s.id}
            id={s.id}
            title={s.title}
            icon={SIcon}
            backToTopOnClick={backToTopOnClick}
          >
            {body}
          </Section>
        );
      })}
    </>
  );
}
>>>>>>> theirs
