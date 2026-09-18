interface HoloBloomProps {
  className?: string;
  blur: number;
}

export function HoloBloom({ className = '', blur }: HoloBloomProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute overflow-hidden pointer-events-none ${className}`}
      style={{ filter: `blur(${blur}px)` }}
    >
      <div className="absolute inset-y-0 -left-225 right-0 bg-holo-sheen bg-size-[900px_100%] holo-slide" />
    </div>
  );
}
