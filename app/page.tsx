import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">InboxZero</h1>
        <p className="text-lg mb-4">AI Email Assistant for DevRel Job Search</p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}

