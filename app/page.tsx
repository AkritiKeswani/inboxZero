import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold mb-4 text-black">InboxZero</h1>
        <p className="text-lg mb-8 text-gray-600">AI Email Assistant for Optimized Job Search</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

