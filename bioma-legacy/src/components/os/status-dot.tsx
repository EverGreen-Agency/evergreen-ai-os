/** Dot de status com glow + pulso (assinatura do legado). */
export function StatusDot({
  color,
  pulse = false,
  title,
}: {
  color: string;
  pulse?: boolean;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-block size-2 rounded-full"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}`,
        animation: pulse ? "os-pulse 1.5s ease-in-out infinite" : undefined,
      }}
    />
  );
}
