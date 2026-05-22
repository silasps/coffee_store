export default function AdminLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200 mb-6" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
