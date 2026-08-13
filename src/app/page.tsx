import { ExperimentFlow } from "@/components/flow/ExperimentFlow";
import { SmallScreenNotice } from "@/components/flow/SmallScreenNotice";

export default function Home() {
  return (
    <>
      <SmallScreenNotice />
      <div className="hidden h-dvh w-full lg:block">
        <ExperimentFlow />
      </div>
    </>
  );
}
