import Forum from "@/components/Forum";

export default function HomePage() {
  return (
    <div>
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-gray-900">Boxing Forum</h1>
        <p className="text-gray-500 text-sm">Real-time discussion</p>
      </div>
      <Forum />
    </div>
  );
}
