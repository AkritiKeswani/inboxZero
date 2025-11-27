import Link from "next/link";
import { Github, ExternalLink } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-white">
      <div className="max-w-2xl w-full text-center">
        <div className="flex flex-col items-center gap-4 mb-4">
          <h1 className="text-5xl font-bold text-black">InboxZero</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <a
              href="https://github.com/AkritiKeswani/inboxZero"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-black transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a
              href="https://www.keswani.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-black transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Website</span>
            </a>
          </div>
        </div>
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

