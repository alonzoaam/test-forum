"use client";

import { useState } from "react";

export default function SecretPage() {
  const [password, setPassword] = useState("");
  const [contentKey, setContentKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setChecking(true);
    setError("");
    setContentKey(null);

    try {
      const res = await fetch("/api/secret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.content_key) {
        setContentKey(data.content_key);
      } else {
        setError(data.error ?? "Wrong password");
      }
    } catch {
      setError("Something went wrong");
    }

    setChecking(false);
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Secret Page</h1>

      {contentKey ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-green-800 font-semibold mb-2">Access Granted</p>
          <p className="text-gray-700">Content key: <code className="bg-gray-100 px-2 py-0.5 rounded">{contentKey}</code></p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Enter password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900"
              placeholder="Password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {checking ? "Checking..." : "Submit"}
          </button>
        </form>
      )}
    </div>
  );
}
