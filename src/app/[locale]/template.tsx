/** Re-mounts on every navigation: two letterbox bars part to open the next scene. */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="letterbox letterbox--top" aria-hidden />
      <div className="letterbox letterbox--bottom" aria-hidden />
      <div className="page-in">{children}</div>
    </>
  );
}
