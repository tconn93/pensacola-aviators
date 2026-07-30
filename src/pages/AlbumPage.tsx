import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, type GalleryImage } from "@/lib/api";

const PER_PAGE = 8;

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const [album, setAlbum] = useState<{ name: string; description: string } | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const albumId = Number(id);

  // Load first page + album info
  useEffect(() => {
    if (!albumId) return;
    api.galleryAlbumImages(albumId, 0).then((data) => {
      setImages(data);
      setOffset(data.length);
      setHasMore(data.length >= PER_PAGE);
    });
    // Get album name from the list endpoint
    api.galleryAlbums(0, 100).then((albums) => {
      const a = albums.find((x) => x.id === albumId);
      if (a) setAlbum({ name: a.name, description: a.description });
    });
  }, [albumId]);

  // Infinite scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setLoading(true);
          api.galleryAlbumImages(albumId, offset).then((data) => {
            setImages((prev) => [...prev, ...data]);
            setOffset((prev) => prev + data.length);
            setHasMore(data.length >= PER_PAGE);
            setLoading(false);
          });
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMore, offset, albumId]);

  if (!album) {
    return (
      <main>
        <section className="section-pad mt-16">
          <div className="container-x">
            <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
              <ArrowLeft size={16} /> Back to gallery
            </Link>
            <p className="text-sm text-[var(--color-muted)]">Loading album...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section-pad mt-16">
        <div className="container-x">
          <Link to="/gallery" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
            <ArrowLeft size={16} /> Back to gallery
          </Link>
          <div className="mb-8">
            <p className="eyebrow mb-3">Album</p>
            <h1 className="heading-lg">{album.name}</h1>
            {album.description && <p className="text-sm text-[var(--color-muted)] mt-2">{album.description}</p>}
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No photos in this album yet.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {images.map((img, i) => (
                  <figure
                    key={img.id}
                    className={`relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card ${
                      i === 0
                        ? "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[28rem]"
                        : "aspect-[4/3]"
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="absolute inset-0 h-full w-full object-cover" />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-bg)]/90 to-transparent p-4 pt-10 text-sm text-[var(--color-muted)]">
                      {img.alt || img.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <div ref={sentinelRef} className="h-10 mt-6" />
              {loading && <p className="text-sm text-[var(--color-muted)] text-center">Loading more...</p>}
              {!hasMore && images.length > 0 && (
                <p className="text-sm text-[var(--color-muted)] text-center mt-6">All photos loaded.</p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
