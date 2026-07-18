export default function RecruiterLoading() {
  return <main className="app-container py-14"><div className="skeleton h-12 w-80" /><div className="mt-8 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-40" />)}</div><div className="mt-10 skeleton h-80" /></main>;
}
