// Pure CSS (no JS width-detection, no hydration-mismatch risk) — shown only
// below the `lg` breakpoint (1024px), hidden at `lg` and up. Pairs with the
// `hidden lg:block` wrapper around ExperimentFlow in app/page.tsx so the
// experiment itself never even mounts its interactive UI on a screen this
// small; side-by-side chat + workspace (see PrototypeShell) needs laptop-
// class width to stay usable.
export function SmallScreenNotice() {
  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center lg:hidden">
      <p className="text-lg font-semibold">노트북(또는 더 큰 화면)에서 진행해주세요</p>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        이 실험은 화면 크기가 충분한 노트북·데스크톱 환경에 맞춰 제작되었습니다.
        태블릿이나 휴대폰에서는 정상적으로 진행할 수 없으니, 노트북으로 다시 접속해 주세요.
      </p>
    </div>
  );
}
