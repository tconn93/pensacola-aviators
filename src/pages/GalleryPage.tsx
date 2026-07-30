import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { api, type GalleryAlbum, type GalleryImage } from "@/lib/api";
import { ImageViewer } from "@/components/ImageViewer";

const PER_PAGE = 8;

export function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albumOffset, setAlbumOffset] = useState(0);
  const [imageOffset, setImageOffset] = useState(0);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    api.galleryAlbums(0).then((data) => {
      setAlbums(data);
      setAlbumOffset(data.length);
      setHasMoreAlbums(data.length >= PER_PAGE);
    });
    api.galleryImages(0).then((data) => {
      setImages(data);
      setImageOffset(data.length);
      setHasMoreImages(data.length >= PER_PAGE);
    });
  }, []);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMoreImages) {
          setLoading(true);
          api.galleryImages(imageOffset).then((data) => {
            setImages((prev) => [...prev, ...data]);
            setImageOffset((prev) => prev + data.length);
            setHasMoreImages(data.length >= PER_PAGE);
            setLoading(false);
          });
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, hasMoreImages, imageOffset]);

  return (
    <main>
      {viewerIdx !== null && (
        <ImageViewer
          images={images.map((i) => ({ url: i.url, alt: i.alt, title: i.title }))}
          currentIndex={viewerIdx}
          onClose={() => setViewerIdx(null)}
          onPrev={() => setViewerIdx((v) => (v !== null && v > 0 ? v - 1 : v))}
          onNext={() => setViewerIdx((v) => (v !== null && v < images.length - 1 ? v + 1 : v))}
        />
      )}
      <section className="section-pad mt-16">
        <div className="container-x">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="mb-8">
            <p className="eyebrow mb-3">Gallery</p>
            <h1 className="heading-lg">Club moments</h1>
          </div>

          {/* ── Albums ── */}
          {albums.length > 0 && (
            <div className="mb-10">
              <h2 className="heading-md mb-4">Albums</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/gallery/${album.id}`}
                    className="snap-start shrink-0 w-64 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-card hover:bg-[var(--color-bg-elevated)] transition-colors group"
                  >
                    <div className="aspect-[4/3] bg-[var(--color-bg-elevated)] relative overflow-hidden">
                      {album.previews.length > 0 ? (
                        <div className="grid grid-cols-2 h-full">
                          {album.previews.slice(0, 2).map((url, i) => (
                            <img key={i} src={url} alt="" className="h-full w-full object-cover" />
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[var(--color-muted)]">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate group-hover:text-[var(--color-primary)]">{album.name}</h3>
                      {album.description && <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{album.description}</p>}
                      <p className="text-xs text-[var(--color-subtle)] mt-1">{album.image_count} photo(s)</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Images ── */}
          <h2 className="heading-md mb-4">All photos</h2>
          {images.length === 0 && albums.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">Photos will appear here after the club publishes them.</p>
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
                    <img src={img.url} alt={img.alt} className="absolute inset-0 h-full w-full object-cover cursor-pointer" onClick={() => setViewerIdx(i)} />
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-bg)]/90 to-transparent p-4 pt-10 text-sm text-[var(--color-muted)]">
                      {img.alt || img.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="h-10 mt-6" />
              {loading && <p className="text-sm text-[var(--color-muted)] text-center">Loading more...</p>}
              {!hasMoreImages && images.length > 0 && (
                <p className="text-sm text-[var(--color-muted)] text-center mt-6">All photos loaded.</p>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
