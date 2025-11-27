"use client";

import { useState, useEffect } from "react";
import { Email, Suggestion } from "@/types";
import { Mail, Calendar, Clock, ExternalLink, CheckCircle2, LogOut, User, Github } from "lucide-react";
import Link from "next/link";

interface EmailResult {
  email: Email;
  analysis: any;
  suggestions: Suggestion[];
  priorityScore?: number;
  definitiveAction?: string;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check URL for token from OAuth callback
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const error = params.get("error");

    if (tokenFromUrl) {
      // Store token in localStorage
      localStorage.setItem("google_access_token", tokenFromUrl);
      setAccessToken(tokenFromUrl);
      setIsAuthenticated(true);
      // Fetch user profile
      fetchUserProfile(tokenFromUrl);
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");
    } else if (error) {
      console.error("OAuth error:", error);
      const details = params.get("details");
      
      // Show helpful error message
      if (error === "access_denied" || error.includes("blocked")) {
        alert(
          "Access blocked. Make sure you've added your email as a test user in Google Cloud Console.\n\n" +
          "Go to: APIs & Services > OAuth consent screen > Test users\n" +
          "Add your email address\n\n" +
          "See README.md for details."
        );
      } else if (error === "redirect_uri_mismatch") {
        const currentUrl = window.location.origin;
        alert(
          `Redirect URI mismatch!\n\n` +
          `Your Vercel URL: ${currentUrl}\n\n` +
          `You need to add this redirect URI to Google Cloud Console:\n` +
          `${currentUrl}/api/auth/callback\n\n` +
          `Steps:\n` +
          `1. Go to Google Cloud Console → APIs & Services → Credentials\n` +
          `2. Click on your OAuth 2.0 Client ID\n` +
          `3. Add "${currentUrl}/api/auth/callback" to Authorized redirect URIs\n` +
          `4. Click Save\n` +
          `5. Wait a few minutes for changes to propagate\n\n` +
          `See README.md for detailed instructions.`
        );
      } else if (error === "invalid_grant") {
        alert(
          "Invalid grant. This usually means:\n\n" +
          "1. The authorization code has expired (try again)\n" +
          "2. The redirect URI doesn't match\n" +
          "3. The code was already used\n\n" +
          "Try signing in again."
        );
      } else {
        alert(`Authentication failed: ${error}${details ? `\n\nDetails: ${details}` : ""}`);
      }
      window.history.replaceState({}, "", "/dashboard");
    } else {
      // Check if we have an access token in localStorage
      const token = localStorage.getItem("google_access_token");
      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
        fetchUserProfile(token);
      }
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken: token }),
      });
      const data = await response.json();
      if (data.email) {
        setUserEmail(data.email);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("google_access_token");
    setAccessToken(null);
    setIsAuthenticated(false);
    setUserEmail(null);
    setEmailResults([]);
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      
      if (data.error) {
        // Show error message to user
        alert(`OAuth Error: ${data.message || data.error}\n\n${data.details || ""}`);
        console.error("OAuth error:", data);
        return;
      }
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        alert("Failed to get authentication URL. Please check server logs.");
      }
    } catch (error: any) {
      console.error("Error initiating auth:", error);
      alert(`Failed to connect: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessEmails = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      // Load user preferences from localStorage
      const savedPrefs = localStorage.getItem("inboxzero_preferences");
      const preferences = savedPrefs ? JSON.parse(savedPrefs) : null;

      const response = await fetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          accessToken,
          preferences, // Pass preferences to server for priority calculation
          userId: userEmail || undefined, // Pass user email as userId for database persistence
        }),
      });

      const data = await response.json();
      if (data.results) {
        // Parse dates back from ISO strings to Date objects
        // Sort by priority score (highest first)
        const parsedResults = data.results
          .map((result: any) => ({
            ...result,
            email: {
              ...result.email,
              date: new Date(result.email.date), // Convert string back to Date
            },
          }))
          .sort((a: EmailResult, b: EmailResult) => {
            // Sort by priority score (highest first)
            const scoreA = a.priorityScore || 0;
            const scoreB = b.priorityScore || 0;
            return scoreB - scoreA;
          });
        setEmailResults(parsedResults);
      }
    } catch (error) {
      console.error("Error processing emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold mb-2 text-black">Connect Your Gmail</h2>
          <p className="text-sm text-gray-600 mb-6">
            Connect your Gmail account to start analyzing your job search emails
          </p>
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Connecting..." : "Connect with Google"}
          </button>
        </div>
      </div>
    );
  }

  const allSuggestions = emailResults.flatMap((result) => result.suggestions);

  return (
    <div className="min-h-screen bg-white">
      {/* Header with auth status */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-black">InboxZero</h1>
            <div className="flex items-center gap-3 text-sm text-gray-600">
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
          <div className="flex items-center gap-4">
            {userEmail && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{userEmail}</span>
                <span className="text-green-600">• Connected</span>
              </div>
            )}
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <p className="text-gray-600">
            AI Email Assistant for Optimized Job Search
          </p>
        </div>

        <div className="mb-8">
          <button
            onClick={handleProcessEmails}
            disabled={isLoading}
            className="px-6 py-3 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Processing..." : "Process Emails"}
          </button>
        </div>

        {allSuggestions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-black">Action Items</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {allSuggestions.map((suggestion) => {
                const email = emailResults.find(
                  (r) => r.email.id === suggestion.emailId
                )?.email;

                return (
                  <div key={suggestion.id} className="border border-gray-200 p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1 text-black">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {email?.fromName} • {email?.subject}
                      </p>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">{suggestion.description}</p>
                    
                    {suggestion.suggestedTime && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(suggestion.suggestedTime).toLocaleString()}</span>
                      </div>
                    )}

                      {suggestion.deadline && (
                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Due: {new Date(suggestion.deadline).toLocaleDateString()}</span>
                        </div>
                      )}

                    {suggestion.linkedInProfileUrl && (
                      <a
                        href={suggestion.linkedInProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-black hover:underline flex items-center gap-1 mb-4"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View LinkedIn Profile
                      </a>
                    )}

                    {suggestion.actionItems.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold mb-2 text-black">Action Items:</p>
                        <ul className="space-y-2">
                          {suggestion.actionItems.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-black" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {emailResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-black">Recent Emails</h2>
            <div className="space-y-4">
              {emailResults.map((result) => {
                const priorityScore = result.priorityScore || 0;
                return (
                  <div key={result.email.id} className="border border-gray-200 p-6">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-black flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {result.email.subject}
                        </h3>
                        <span className={`text-xs px-2 py-1 border ${
                          priorityScore >= 70 ? "border-red-500 text-red-700 bg-red-50" :
                          priorityScore >= 40 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                          "border-gray-300 text-gray-600"
                        }`}>
                          {priorityScore >= 70 ? "HIGH" : priorityScore >= 40 ? "MEDIUM" : "LOW"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {result.email.fromName} • {result.email.date.toLocaleDateString()}
                        {result.email.isLinkedInNotification && (
                          <span className="ml-2 px-2 py-0.5 border border-gray-300 text-xs">
                            LinkedIn
                          </span>
                        )}
                      </p>
                      {result.definitiveAction && (
                        <p className="text-sm font-medium text-black mt-2">
                          → {result.definitiveAction}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                      {result.email.snippet}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 border border-gray-300">
                        {result.analysis.intent}
                      </span>
                      {priorityScore > 0 && (
                        <span className="text-xs px-2 py-1 border border-gray-300">
                          Score: {priorityScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

