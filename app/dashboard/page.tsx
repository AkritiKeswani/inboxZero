"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Email, Suggestion } from "@/types";
import { Mail, Calendar, Clock, ExternalLink, CheckCircle2 } from "lucide-react";

interface EmailResult {
  email: Email;
  analysis: any;
  suggestions: Suggestion[];
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailResults, setEmailResults] = useState<EmailResult[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
      // Clean up URL
      window.history.replaceState({}, "", "/dashboard");
    } else if (error) {
      console.error("OAuth error:", error);
      alert(`Authentication failed: ${error}`);
      window.history.replaceState({}, "", "/dashboard");
    } else {
      // Check if we have an access token in localStorage
      const token = localStorage.getItem("google_access_token");
      if (token) {
        setAccessToken(token);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleGoogleAuth = async () => {
    try {
      const response = await fetch("/api/auth/google");
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error("Error initiating auth:", error);
    }
  };

  const handleProcessEmails = async () => {
    if (!accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();
      if (data.results) {
        setEmailResults(data.results);
      }
    } catch (error) {
      console.error("Error processing emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Your Gmail</CardTitle>
            <CardDescription>
              Connect your Gmail account to start analyzing your job search emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleGoogleAuth} className="w-full">
              Connect with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allSuggestions = emailResults.flatMap((result) => result.suggestions);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">InboxZero</h1>
          <p className="text-muted-foreground">
            AI Email Assistant for Optimized Job Search
          </p>
        </div>

        <div className="mb-6">
          <Button onClick={handleProcessEmails} disabled={isLoading}>
            {isLoading ? "Processing..." : "Process Emails"}
          </Button>
        </div>

        {allSuggestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Action Items</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allSuggestions.map((suggestion) => {
                const email = emailResults.find(
                  (r) => r.email.id === suggestion.emailId
                )?.email;

                return (
                  <Card key={suggestion.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {suggestion.title}
                        </CardTitle>
                        {suggestion.type === "linkedin-followup" && (
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <CardDescription>
                        {email?.fromName} • {email?.subject}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4">{suggestion.description}</p>
                      
                      {suggestion.suggestedTime && (
                        <div className="flex items-center gap-2 mb-2 text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(suggestion.suggestedTime).toLocaleString()}</span>
                        </div>
                      )}

                      {suggestion.deadline && (
                        <div className="flex items-center gap-2 mb-2 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Due: {suggestion.deadline.toLocaleDateString()}</span>
                        </div>
                      )}

                      {suggestion.linkedInProfileUrl && (
                        <a
                          href={suggestion.linkedInProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View LinkedIn Profile
                        </a>
                      )}

                      {suggestion.actionItems.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold mb-2">Action Items:</p>
                          <ul className="space-y-1">
                            {suggestion.actionItems.map((item, idx) => (
                              <li key={idx} className="text-xs flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {emailResults.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Recent Emails</h2>
            <div className="space-y-4">
              {emailResults.map((result) => (
                <Card key={result.email.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {result.email.subject}
                        </CardTitle>
                        <CardDescription>
                          {result.email.fromName} • {result.email.date.toLocaleDateString()}
                          {result.email.isLinkedInNotification && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                              LinkedIn
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {result.email.snippet}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {result.analysis.intent}
                      </span>
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {result.analysis.priority} priority
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

