import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { api, type AdminAlbumImage, type Admin, type GalleryImage } from "@/lib/api";

const PER_PAGE = 8;

export function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const albumId = Number(id);
  const [album, setAlbum] = useState<{ name: string; description: string } | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [images, setImages] = useState<(GalleryImage | AdminAlbumImage)[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Check auth
  useEffect(() => {
    api.me().then((r) => setAdmin(r.admin)).catch(() => setAdmin(null));
  }, []);

  // Load images
  useEffect(() => {
    if (!albumId) return;
    if (admin) {
      // Admin mode: load all images at once
      api.adminAlbumImages(albumId).then((data) => {
        setImages(data);
        setHasMore(false);
      });
    } else {
      // Public mode: paginated
      api.galleryAlbumImages(albumId, 0).then((data) => {
        setImages(data);
        setOffset(data.length);
        setHasMore(data.length >= PER_PAGE);
      });
    }
    // Get album info
    api.galleryAlbums(0, 100).then((albums) => {
      const a = albums.find((x) => x.id === albumId);
      if (a) setAlbum({ name: a.name, description: a.description });
    });
  }, [albumId, admin]);

  // Infinite scroll (public only)
  useEffect(() => {
    if (admin) return;
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
  }, [loading, hasMore, offset, albumId, admin]);

  if (!album) {
    return (
      <main>
        <section className="section-pad mt-16">
          <div className="container-x">
            <Link to={admin ? "/admin" : "/gallery"} className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
              <ArrowLeft size={16} /> {admin ? "Back to admin" : "Back to gallery"}
            </Link>
            <p className="text-sm text-[var(--color-muted)]">Loading album...</p>
          </div>
        </section>
      </main>
    );
  }

  async function deleteImage(imgId: number) {
    if (!confirm("Delete this image?")) return;
    await api.deleteMedia(imgId);
    setImages((prev) => prev.filter((i) => i.id !== imgId));
  }

  async function togglePublished(imgId: number, val: boolean) {
    await api.patchMedia(imgId, { published: val });
    setImages((prev) => prev.map((i) => i.id === imgId ? { ...i, published: val } : i));
  }

  async function toggleHome(imgId: number, val: boolean) {
    await api.patchMedia(imgId, { show_on_home: val });
    setImages((prev) => prev.map((i) => i.id === imgId ? { ...i, show_on_home: val } : i));
  }

  async function toggleGallery(imgId: number, val: boolean) {
    await api.patchMedia(imgId, { show_in_gallery: val });
    setImages((prev) => prev.map((i) => i.id === imgId ? { ...i, show_in_gallery: val } : i));
  }

  return (
    <main>
      <section className="section-pad mt-16">
        <div className="container-x">
          <Link to={admin ? "/admin" : "/gallery"} className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
            <ArrowLeft size={16} /> {admin ? "Back to admin" : "Back to gallery"}
          </Link>
          <div className="mb-8">
            <p className="eyebrow mb-3">Album</p>
            <h1 className="heading-lg">{album.name}</h1>
            {album.description && <p className="text-sm text-[var(--color-muted)] mt-2">{album.description}</p>}
            {admin && <p className="text-xs text-[var(--color-primary)] mt-1">Admin mode — editing album images</p>}
          </div>

          {images.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No photos in this album yet.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {images.map((img, i) => {
                  const isAdminImg = "published" in img;
                  return (
                    <figure
                      key={img.id}
                      className={`relative overflow-hidden rounded-2xl border ${
                        isAdminImg && !(img as AdminAlbumImage).published
                          ? "border-[var(--color-primary)]/50 opacity-60"
                          : "border-[var(--color-border)]"
                      } bg-[var(--color-surface)] shadow-card ${
                        i === 0
                          ? "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[28rem]"
                          : "aspect-[4/3]"
                      }`}
                    >
                      <img src={img.url} alt={img.alt} className="absolute inset-0 h-full w-full object-cover" />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-bg)]/90 to-transparent p-4 pt-10 text-sm text-[var(--color-muted)]">
                        {img.alt || img.title}
                      </figcaption>

                      {admin && isAdminImg && (
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm bg-[var(--color-bg)]/80 backdrop-blur-sm p-1"
                            onClick={() => deleteImage(img.id)}
                            title="Delete"
                          >
                            <Trash2 size={14} className="text-[var(--color-primary)]" />
                          </button>
                        </div>
                      )}

                      {admin && isAdminImg && (
                        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
                          <ToggleBadge
                            label="Live"
                            active={(img as AdminAlbumImage).published}
                            onClick={(v) => togglePublished(img.id, v)}
                          />
                          <ToggleBadge
                            label="Home"
                            active={(img as AdminAlbumImage).show_on_home}
                            onClick={(v) => toggleHome(img.id, v)}
                          />
                          <ToggleBadge
                            label="Gallery"
                            active={(img as AdminAlbumImage).show_in_gallery}
                            onClick={(v) => toggleGallery(img.id, v)}
                          />
                        </div>
                      )}
                    </figure>
                  );
                })}
              </div>

              {!admin && (
                <>
                  <div ref={sentinelRef} className="h-10 mt-6" />
                  {loading && <p className="text-sm text-[var(--color-muted)] text-center">Loading more...</p>}
                  {!hasMore && images.length > 0 && (
                    <p className="text-sm text-[var(--color-muted)] text-center mt-6">All photos loaded.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function ToggleBadge({ label, active, onClick }: { label: string; active: boolean; onClick: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onClick(!active)}
      className={`text-[0.6rem] font-medium px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${
        active
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/30 text-white"
          : "border-[var(--color-border)] bg-[var(--color-bg)]/60 text-[var(--color-muted)]"
      }`}
    >
      {label}
    </button>
  );
}
