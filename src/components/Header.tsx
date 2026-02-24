"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import ProfileDropdown from "./ProfileDropdown";
import AuthModal from "./AuthModal";
import { createClient } from "@/lib/supabase-browser";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/photos", label: "Photos" },
  { href: "/secret", label: "Secret" },
];

export default function Header() {
  const { user, profile, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowDropdown(false);
  };

  return (
    <>
      <header className="bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`hover:text-yellow-400 transition-colors ${
                  pathname === link.href ? "text-yellow-400 font-semibold" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="relative flex items-center gap-3">
            {loading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : user ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-8 h-8 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">
                      {profile?.display_name?.[0]?.toUpperCase() ?? "?"}
                    </span>
                  )}
                </button>
                {showDropdown && (
                  <ProfileDropdown onClose={() => setShowDropdown(false)} />
                )}
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm bg-yellow-500 text-gray-900 px-3 py-1 rounded font-semibold hover:bg-yellow-400"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </>
  );
}
