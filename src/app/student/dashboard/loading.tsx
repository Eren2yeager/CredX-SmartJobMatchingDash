export default function DashboardLoading() {
  return <main className="app-container py-14"><div className="skeleton h-12 w-72" /><div className="mt-8 skeleton h-28" /><div className="mt-8 grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((item) => <div key={item} className="skeleton h-72" />)}</div></main>;
}
