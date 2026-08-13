// Cards without a real photo yet (see scripts/fetch-unsplash-photos.mjs)
// use a CSS gradient instead — MediaCover.tsx already knows how to render
// either. Cycle through a small curated set so a big grid of new,
// not-yet-photographed candidates doesn't read as one flat color block.
// Once real photos are sourced for these ids, swap `image` to the
// "/photos/{id}.jpg" path and this stops being referenced for that item.
const PLACEHOLDER_GRADIENTS = [
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  "linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)",
];

export function placeholderImage(index: number): string {
  return PLACEHOLDER_GRADIENTS[index % PLACEHOLDER_GRADIENTS.length];
}
