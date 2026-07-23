export default function GameAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="game-area-wrapper min-h-screen bg-neutral-950">
      {children}
    </div>
  );
}