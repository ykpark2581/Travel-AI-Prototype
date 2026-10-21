// Shown instead of the whole experiment once the study is closed (see
// lib/studyStatus.ts). Pure markup — nothing here depends on the store, so
// it renders identically on every screen size.
export function StudyClosedNotice() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center">
      <p className="text-lg font-semibold">본 실험은 종료되었습니다.</p>
      <p className="text-sm text-muted-foreground">감사합니다.</p>
    </div>
  );
}
