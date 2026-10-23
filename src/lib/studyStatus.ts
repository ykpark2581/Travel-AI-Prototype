// Single switch for taking the study offline. While true, a normal visit to
// the site shows only the closing notice (components/flow/StudyClosedNotice.tsx)
// and the experiment itself is never rendered. Set back to false to reopen it.
//
// The ?preview=human|mixed|ai|survey developer shortcuts (see
// components/flow/ExperimentFlow.tsx) deliberately still work while closed —
// they're the researcher's way back in for screenshots and checks. Anything
// they submit is real (it writes to the Google Forms), so delete test rows.
//
// This only affects people who LOAD the page from now on — a session that is
// already open keeps working and can still submit its responses.
export const STUDY_CLOSED = true;

export const PREVIEW_SHORTCUTS = ["human", "mixed", "ai", "survey"];
