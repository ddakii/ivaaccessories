export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-line/80 ${className}`} />;
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-line bg-ivory px-8 py-16 text-center">
      <h2 className="nav-type-lg">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-line px-8 py-12 text-center">
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
