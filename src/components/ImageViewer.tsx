import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageViewer({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: { url: string; alt: string; title?: string | null }[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const img = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--color-bg)]/95 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute top-4 right-4 z-10 btn btn-ghost btn-sm p-2 bg-[var(--color-bg)]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-sm text-[var(--color-muted)] bg-[var(--color-bg)]/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Previous arrow */}
      {hasPrev && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 btn btn-ghost p-2 bg-[var(--color-bg)]/60 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Image */}
      <img
        src={img?.url}
        alt={img?.alt || ""}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Caption */}
      {(img?.alt || img?.title) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-[var(--color-muted)] bg-[var(--color-bg)]/60 backdrop-blur-sm px-4 py-2 rounded-full max-w-lg truncate">
          {img.alt || img.title}
        </div>
      )}

      {/* Next arrow */}
      {hasNext && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 btn btn-ghost p-2 bg-[var(--color-bg)]/60 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}
