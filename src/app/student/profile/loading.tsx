export default function ProfileLoading() {
  return (
    <main className="app-container py-14">
      <div className="skeleton h-12 w-72" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="skeleton h-[620px]" />
        <div className="skeleton h-80" />
      </div>
    </main>
  );
}
