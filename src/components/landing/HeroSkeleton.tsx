export function HeroSkeleton() {
  return (
    <div className="animate-pulse absolute inset-0 flex items-center justify-center">
      <div
        style={{
          width: '78%',
          height: '82%',
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgb(30 41 59) 0%, rgb(51 65 85) 100%)',
        }}
      />
    </div>
  );
}
