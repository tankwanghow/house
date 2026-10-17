import { ChevronDown, ChevronUp, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { safetyBanner, safetySections, type SafetyFocus, type SafetySection } from "@/shed/safety";

type Props = {
  active: SafetyFocus | null;
  onSelect: (id: SafetyFocus | null) => void;
  onClose: () => void;
  /** CSS px of the model the panel covers: on the left (wide screens) or at the bottom (phone sheet). */
  onInsets: (left: number, bottom: number) => void;
};

const tone: Record<SafetySection["tone"], { head: string; dot: string; on: string }> = {
  danger: { head: "text-red-300", dot: "bg-red-500", on: "border-red-500/80 bg-red-950/60" },
  saving: { head: "text-emerald-300", dot: "bg-emerald-500", on: "border-emerald-500/80 bg-emerald-950/50" },
  solar: { head: "text-lime-300", dot: "bg-lime-400", on: "border-lime-500/80 bg-lime-950/50" },
  ok: { head: "text-teal-300", dot: "bg-teal-400", on: "border-teal-400/80 bg-teal-950/50" },
  note: { head: "text-slate-300", dot: "bg-slate-400", on: "border-slate-400/80 bg-slate-800/60" },
};

/**
 * Review notes over the model. Phones: a short bottom sheet (at most ~45% of the model, scrollable, can be
 * folded down to its title bar). Wide screens: a card in the model's top-left corner.
 */
export function SafetyPanel({ active, onSelect, onClose, onInsets }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [folded, setFolded] = useState(false);
  const activeItem = safetySections.flatMap((s) => s.items).find((i) => i.id === active) ?? null;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const report = () => {
      const r = el.getBoundingClientRect();
      const host = el.parentElement?.getBoundingClientRect();
      if (window.innerWidth < 768) onInsets(0, r.height);
      else onInsets(host ? r.right - host.left : 0, 0);
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener("resize", report);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", report);
      onInsets(0, 0);
    };
  }, [onInsets]);

  return (
    <section
      ref={ref}
      data-testid="safety-panel"
      aria-label="Safety review"
      className="absolute inset-x-0 bottom-0 z-20 flex max-h-[45%] flex-col rounded-t-xl border-t border-amber-700/70 bg-surface/95 text-fg shadow-2xl backdrop-blur-sm md:inset-x-auto md:bottom-auto md:left-2 md:top-2 md:max-h-[calc(100%-1rem)] md:w-[23rem] md:rounded-lg md:border"
    >
      <header className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-amber-200">Safety review</p>
          {folded && activeItem && <p className="truncate text-[11px] text-muted">Showing: {activeItem.title}</p>}
        </div>
        <button
          type="button"
          onClick={() => setFolded((f) => !f)}
          aria-label={folded ? "Expand safety panel" : "Fold safety panel"}
          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-surface-2 md:hidden"
        >
          {folded ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close safety panel"
          className="inline-flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-surface-2 sm:h-7 sm:w-7"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </header>
      <div className={folded ? "hidden md:block md:overflow-y-auto" : "min-h-0 flex-1 overflow-y-auto overscroll-contain"}>
        <p className="m-2 rounded border border-amber-600/70 bg-amber-950/60 px-2 py-1.5 text-[11px] font-medium leading-snug text-amber-100">
          {safetyBanner}
        </p>
        {safetySections.map((section) => (
          <div key={section.id} className="px-2 pb-2">
            <h2 className={`px-1 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide ${tone[section.tone].head}`}>
              {section.title}
            </h2>
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const on = item.id === active;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-safety={item.id}
                      aria-pressed={on}
                      onClick={() => onSelect(on ? null : item.id)}
                      className={`w-full rounded border px-2 py-1.5 text-left text-xs leading-snug ${
                        on ? tone[section.tone].on : "border-border bg-surface-2/40 hover:bg-surface-2"
                      }`}
                    >
                      <span className="flex items-start gap-1.5">
                        <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${tone[section.tone].dot}`} aria-hidden />
                        <span className="flex-1 font-medium">{item.title}</span>
                        {item.tag && <span className="shrink-0 font-mono text-[10px] text-muted">{item.tag}</span>}
                      </span>
                      {item.status && (
                        <span className="mt-0.5 block pl-3 text-[10px] font-medium text-sky-300">{item.status}</span>
                      )}
                      {on && (
                        <span className="mt-1 block pl-3 text-[11px] text-fg/90">
                          {item.body}
                          <span className="mt-1 block text-muted">
                            In the model: {item.shows}.{item.engineer ? " Engineer sign-off needed." : ""}
                          </span>
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="px-3 pb-3 text-[10px] text-muted">Tap an item to show it in the model; tap it again to clear.</p>
      </div>
    </section>
  );
}
