export default function ApplicationsLoading() {
  return <main className="app-container py-14"><div className="skeleton h-12 w-72" /><div className="mt-8 space-y-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-32 w-full" />)}</div></main>;
}
