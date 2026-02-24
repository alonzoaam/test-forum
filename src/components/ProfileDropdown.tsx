"use client";

import { useState, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase-browser";

export default function ProfileDropdown({ onClose }: { onClose: () => void }) {
  const { profile, user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (error) {
      setMessage("Error saving profile");
    } else {
      setMessage("Saved!");
      await refreshProfile();
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);
    setMessage("");

    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setMessage("Error uploading image");
      setSaving(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      setMessage("Error updating profile");
    } else {
      setMessage("Avatar updated!");
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Edit Profile</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      <div className="mb-2">
        <span className="block text-sm text-gray-400 mb-1">Username</span>
        <span className="text-sm text-gray-700">{profile?.username}</span>
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-900"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm text-gray-600 mb-1">
          Profile Picture
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleAvatarUpload}
          className="w-full text-sm text-gray-900"
        />
      </div>

      {message && (
        <p className="text-sm text-green-600 mb-2">{message}</p>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
