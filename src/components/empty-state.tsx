interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mb-4 text-6xl">{icon}</div>
      <h2 className="text-2xl font-semibold text-zinc-200">{title}</h2>
      <p className="mt-2 text-zinc-500">{message}</p>
    </div>
  );
}