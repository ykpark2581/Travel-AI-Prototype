import { ExperimentFlow } from "@/components/flow/ExperimentFlow";
import { SmallScreenNotice } from "@/components/flow/SmallScreenNotice";
import { StudyClosedNotice } from "@/components/flow/StudyClosedNotice";
import { PREVIEW_SHORTCUTS, STUDY_CLOSED } from "@/lib/studyStatus";

export default async function Home({ searchParams }: { searchParams: Promise<{ preview?: string | string[] }> }) {
  const { preview } = await searchParams;
  const isDeveloperShortcut = typeof preview === "string" && PREVIEW_SHORTCUTS.includes(preview);

  if (STUDY_CLOSED && !isDeveloperShortcut) return <StudyClosedNotice />;

  return (
    <>
      <SmallScreenNotice />
      <div className="hidden h-dvh w-full lg:block">
        <ExperimentFlow />
      </div>
    </>
  );
}
