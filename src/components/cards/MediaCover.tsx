// Destination photos are being sourced in batches (see scripts/fetch-unsplash-photos.mjs)
// — some items still hold a CSS-gradient placeholder in `image` while others
// already point at a real /photos/*.jpg file. Render whichever the data has.
export function MediaCover({ image, alt }: { image: string; alt: string }) {
  const isPhoto = image.startsWith("/") || image.startsWith("http");
  if (isPhoto) {
    return <img src={image} alt={alt} className="h-full w-full object-cover" />;
  }
  return <div className="h-full w-full" style={{ background: image }} />;
}
