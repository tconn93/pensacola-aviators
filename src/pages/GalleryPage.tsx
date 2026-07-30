import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type SitePayload } from "@/lib/api";

const PER_PAGE = 8;

export function GalleryPage() {
  const [site, setSite] = useState<SitePayload | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.site().then(setSite).catch(() => setSite(null));
  }, []);

  const allImages = site?.galleryImages || [];
  const totalPages = Math.max(1, Math.ceil(allImages.length / PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const pageImages = allImages.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE);

  return (
    <main>
      <section className="section-pad mt-16">
        <div className="container-x">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] mb-6">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="mb-10">
            <p className="eyebrow mb-3">Gallery</p>
            <h1 className="heading-lg">Club moments</h1>
          </div>

          {allImages.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Photos will appear here after the club publishes them from the media library.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {pageImages.map((img, i) => {
                  const globalIdx = safePage * PER_PAGE + i;
                  return (
                    <figure
                      key={img.id}
                      className={`relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card ${
                        globalIdx === 0
                          ? "md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[28rem]"
                          : "aspect-[4/3]"
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--color-bg)]/90 to-transparent p-4 pt-10 text-sm text-[var(--color-muted)]">
                        {img.alt || img.title}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-10">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={safePage === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm text-[var(--color-muted)]">
                    Page {safePage + 1} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={safePage >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
