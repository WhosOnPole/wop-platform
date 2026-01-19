interface EntityHeroBackgroundProps {
  imageUrl: string | null | undefined
  alt: string
}

export function EntityHeroBackground({ imageUrl, alt }: EntityHeroBackgroundProps) {
  if (!imageUrl) return null

  return (
    <div className="absolute inset-0 z-0">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
        aria-label={alt}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
    </div>
  )
}
