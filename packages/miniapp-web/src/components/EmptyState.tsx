type Props = { title: string; description?: string };

export function EmptyState({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="mt-2 text-sm text-[var(--tg-hint-color,#999)]">{description}</p>
      )}
    </div>
  );
}
