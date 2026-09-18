export function CardBackBackdrop({ opacity = 0.1 }: { opacity?: number }) {
  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -inset-15 bg-[url('/assets/OPZDexCardBackTile.jpg')] bg-size-[150px_210px]"
          style={{ opacity, transform: 'rotate(-10deg) scale(1.18)' }}
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-black/80 pointer-events-none" />
    </>
  );
}
