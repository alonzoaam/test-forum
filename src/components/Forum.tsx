"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthProvider";
import { createClient } from "@/lib/supabase-browser";

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export default function Forum() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*, profiles(username, display_name, avatar_url)")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as Message[]);
    };

    fetchMessages();

    const channel = supabase
      .channel("forum-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(username, display_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setSending(true);
    await supabase
      .from("messages")
      .insert({ content: newMessage.trim(), user_id: user.id });
    setNewMessage("");
    setSending(false);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-8">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden flex items-center justify-center">
              {msg.profiles.avatar_url ? (
                <img
                  src={msg.profiles.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-600">
                  {(msg.profiles.display_name ?? msg.profiles.username)[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {msg.profiles.display_name ?? msg.profiles.username}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.created_at)}
                </span>
              </div>
              <p className="text-gray-700">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {user ? (
        <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <div className="p-4 border-t text-center text-gray-500">
          Log in to send messages
        </div>
      )}
    </div>
  );
}
