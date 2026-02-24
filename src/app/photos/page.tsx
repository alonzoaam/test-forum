"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

type PhotoFile = {
  name: string;
  url: string;
};

export default function PhotosPage() {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase.storage
        .from("photos")
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const photoFiles = data
        .filter((f) => f.name !== ".emptyFolderPlaceholder")
        .map((file) => ({
          name: file.name,
          url: supabase.storage.from("photos").getPublicUrl(file.name).data
            .publicUrl,
        }));

      setPhotos(photoFiles);
      setLoading(false);
    };

    fetchPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Photos</h1>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : photos.length === 0 ? (
        <p className="text-gray-500">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.name} className="aspect-square overflow-hidden rounded-lg bg-gray-200">
              <img
                src={photo.url}
                alt={photo.name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
