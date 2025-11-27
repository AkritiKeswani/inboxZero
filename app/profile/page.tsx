"use client";

import { useState, useEffect } from "react";
import { UserPreferences } from "@/types/preferences";
import { DEFAULT_PREFERENCES } from "@/types/preferences";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Profile() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem("inboxzero_preferences");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading preferences:", e);
      }
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (in production, save to database)
      localStorage.setItem("inboxzero_preferences", JSON.stringify(preferences));
      
      // Also save to API (for future database integration)
      await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateArray = (key: keyof UserPreferences, value: string, add: boolean) => {
    setPreferences((prev) => {
      const current = (prev[key] as string[]) || [];
      if (add) {
        return { ...prev, [key]: [...current, value] };
      } else {
        return { ...prev, [key]: current.filter((item) => item !== value) };
      }
    });
  };

  const addItem = (key: keyof UserPreferences, inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input && input.value.trim()) {
      updateArray(key, input.value.trim(), true);
      input.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-black">Profile</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save"}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-8">
        <div className="space-y-12">
          {/* Background & Skills */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-black">Your Background</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Skills
                </label>
                <input
                  type="text"
                  id="skills-input"
                  placeholder="e.g., React, TypeScript, Node.js, AWS"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const skills = input.value.split(",").map((s) => s.trim()).filter(Boolean);
                      setPreferences((prev) => ({
                        ...prev,
                        skills: [...new Set([...prev.skills, ...skills])],
                      }));
                      input.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 border border-blue-200 text-sm rounded-sm flex items-center gap-1"
                    >
                      {skill}
                      <button
                        onClick={() => updateArray("skills", skill, false)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter to add. These help identify relevant opportunities.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Past Roles
                </label>
                <input
                  type="text"
                  id="past-roles-input"
                  placeholder="e.g., Senior Software Engineer, Tech Lead"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("pastRoles", "past-roles-input");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.pastRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-sm rounded-sm flex items-center gap-1"
                    >
                      {role}
                      <button
                        onClick={() => updateArray("pastRoles", role, false)}
                        className="text-gray-500 hover:text-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Desired Roles
                </label>
                <input
                  type="text"
                  id="desired-roles-input"
                  placeholder="e.g., Staff Engineer, Engineering Manager"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("desiredRoles", "desired-roles-input");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.desiredRoles.map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-50 border border-green-200 text-sm rounded-sm flex items-center gap-1"
                    >
                      {role}
                      <button
                        onClick={() => updateArray("desiredRoles", role, false)}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Roles you're actively seeking - these boost priority for matching emails
                </p>
              </div>
            </div>
          </section>

          {/* Company Priorities */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-black">Company Priorities</h2>
            <p className="text-sm text-gray-600 mb-4">
              Rank companies by how interested you are in working there
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  High Priority Companies
                </label>
                <input
                  type="text"
                  id="high-companies-input"
                  placeholder="e.g., Stripe, OpenAI, Vercel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("highPriorityCompanies", "high-companies-input");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.highPriorityCompanies.map((company, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-50 border border-red-200 text-sm rounded-sm flex items-center gap-1"
                    >
                      {company}
                      <button
                        onClick={() => updateArray("highPriorityCompanies", company, false)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Medium Priority Companies
                </label>
                <input
                  type="text"
                  id="medium-companies-input"
                  placeholder="e.g., Google, Microsoft, Amazon"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("mediumPriorityCompanies", "medium-companies-input");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.mediumPriorityCompanies.map((company, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-yellow-50 border border-yellow-200 text-sm rounded-sm flex items-center gap-1"
                    >
                      {company}
                      <button
                        onClick={() => updateArray("mediumPriorityCompanies", company, false)}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Low Priority / Not Interested
                </label>
                <input
                  type="text"
                  id="low-companies-input"
                  placeholder="Companies to deprioritize"
                  className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addItem("lowPriorityCompanies", "low-companies-input");
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {preferences.lowPriorityCompanies.map((company, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-sm rounded-sm flex items-center gap-1"
                    >
                      {company}
                      <button
                        onClick={() => updateArray("lowPriorityCompanies", company, false)}
                        className="text-gray-500 hover:text-black"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* What Matters Most */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-black">What Matters Most</h2>
            <p className="text-sm text-gray-600 mb-4">
              Keywords that indicate high-priority emails for you
            </p>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                High Priority Keywords
              </label>
              <input
                type="text"
                id="high-keywords-input"
                placeholder="e.g., interview, offer, final round, deadline"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("highPriorityKeywords", "high-keywords-input");
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences.highPriorityKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-red-50 border border-red-200 text-sm rounded-sm flex items-center gap-1"
                  >
                    {keyword}
                    <button
                      onClick={() => updateArray("highPriorityKeywords", keyword, false)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Preferred Response Time (hours)
              </label>
              <input
                type="number"
                value={preferences.preferredResponseTime}
                onChange={(e) =>
                  setPreferences((prev) => ({
                    ...prev,
                    preferredResponseTime: parseInt(e.target.value) || 24,
                  }))
                }
                className="w-32 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-black"
                min="1"
                max="168"
              />
              <p className="text-xs text-gray-500 mt-1">
                How quickly you typically respond to important emails
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

