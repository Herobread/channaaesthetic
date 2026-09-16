import { ArrowRight, Check, Clock, Sparkles, Star } from "lucide-react";

export default function TokenTestPage() {
  return (
    <div className="min-h-screen bg-surface-canvas text-text-primary antialiased py-16 px-6 sm:px-10 selection:bg-accent/20 selection:text-accent">
      <div className="max-w-4xl mx-auto space-y-16">
        {/* 1. Header & Semantic Swatches */}
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-subtle border border-border-subtle text-xs font-medium tracking-wider uppercase text-text-muted">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Token System Audit
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal">
            Channa Luxury Editorial Palette
          </h1>
          <p className="text-text-muted text-sm max-w-xl">
            Testing semantic tokens across elevated cards, interactive states,
            form inputs, and dark inversion surfaces.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3 bg-surface-elevated border border-border-subtle rounded-xl shadow-xs">
              <div className="w-full h-8 rounded-md bg-surface-canvas border border-border-subtle mb-2" />
              <p className="text-xs font-semibold">surface-canvas</p>
              <p className="text-[10px] text-text-muted">#fafaf8</p>
            </div>
            <div className="p-3 bg-surface-elevated border border-border-subtle rounded-xl shadow-xs">
              <div className="w-full h-8 rounded-md bg-surface-subtle mb-2" />
              <p className="text-xs font-semibold">surface-subtle</p>
              <p className="text-[10px] text-text-muted">#f4f0ea</p>
            </div>
            <div className="p-3 bg-surface-elevated border border-border-subtle rounded-xl shadow-xs">
              <div className="w-full h-8 rounded-md bg-accent mb-2" />
              <p className="text-xs font-semibold">accent</p>
              <p className="text-[10px] text-text-muted">#b8925d</p>
            </div>
            <div className="p-3 bg-surface-elevated border border-border-subtle rounded-xl shadow-xs">
              <div className="w-full h-8 rounded-md bg-surface-dark mb-2" />
              <p className="text-xs font-semibold">surface-dark</p>
              <p className="text-[10px] text-text-muted">#1a1a1a</p>
            </div>
          </div>
        </header>

        {/* 2. Elevated Cards & Booking Elements */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted">
            01. Elevated Cards &amp; Interactive Elements
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Treatment Card */}
            <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-accent" /> 45 mins
                  </span>
                  <span className="font-semibold text-text-primary">£250</span>
                </div>
                <h3 className="font-serif text-xl font-normal text-text-primary">
                  Dermal Volumisation
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  Precision sculpting designed to restore natural facial
                  contours using medical-grade hyaluronic acid.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex-1 bg-accent hover:bg-accent-hover text-text-inverted text-xs font-medium py-3 rounded-xl transition-colors cursor-pointer text-center"
                >
                  Book Appointment
                </button>
                <button
                  type="button"
                  className="px-4 py-3 bg-surface-subtle border border-border-subtle text-text-primary hover:border-border-focus text-xs font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Details
                </button>
              </div>
            </div>

            {/* Date / Slot Selection State */}
            <div className="bg-surface-elevated border border-border-subtle rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Slot Selection States
                </h3>
                <span className="text-[11px] text-accent font-medium">
                  Step 2 of 3
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Default/Inactive Slot */}
                <div className="border border-border-subtle rounded-xl p-3 text-center bg-surface-elevated hover:border-border-focus transition-all cursor-pointer">
                  <p className="text-[10px] text-text-muted uppercase font-medium">
                    10:00 AM
                  </p>
                  <p className="text-xs font-semibold text-text-primary mt-0.5">
                    Available
                  </p>
                </div>

                {/* Selected Slot */}
                <div className="border border-accent bg-accent text-text-inverted rounded-xl p-3 text-center shadow-xs cursor-pointer">
                  <p className="text-[10px] text-text-inverted/80 uppercase font-medium">
                    11:30 AM
                  </p>
                  <p className="text-xs font-semibold text-text-inverted mt-0.5">
                    Selected
                  </p>
                </div>

                {/* Disabled / Subtle Slot */}
                <div className="border border-border-subtle bg-surface-subtle/50 rounded-xl p-3 text-center opacity-40 cursor-not-allowed">
                  <p className="text-[10px] text-text-muted uppercase font-medium">
                    02:00 PM
                  </p>
                  <p className="text-xs font-medium text-text-muted mt-0.5">
                    Booked
                  </p>
                </div>
              </div>

              {/* Form Input Test */}
              <div className="pt-2 space-y-1.5">
                <label className="text-[11px] text-text-muted font-medium block">
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lady Victoria Spencer"
                  className="w-full bg-surface-canvas border border-border-subtle focus:border-border-focus rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted/60 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Inverted / Dark Hero Simulation */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted">
            02. Dark Contrast / Inverted Surface (Hero &amp; Footer Style)
          </h2>

          <div className="bg-surface-dark text-text-inverted rounded-3xl p-8 sm:p-10 space-y-6 relative overflow-hidden">
            <div className="relative z-10 max-w-xl space-y-4">
              {/* Champagne highlight test */}
              <div className="inline-flex items-center gap-1.5 text-accent-champagne text-xs tracking-wide font-medium">
                <Star className="w-3.5 h-3.5 fill-accent-champagne" />
                <span>Private Consultation Clinic • Harley Street</span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-normal leading-snug">
                Discretion. Artistry. <br />
                Clinical Integrity.
              </h3>

              <p className="text-text-inverted/70 text-xs leading-relaxed font-light">
                This block tests{" "}
                <code className="text-accent-champagne">accent-champagne</code>{" "}
                and opacity layers over{" "}
                <code className="text-accent-champagne">surface-dark</code> to
                confirm seamless luxury contrast.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-text-inverted text-xs font-medium px-5 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Schedule Private Visit <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs text-text-inverted/50 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-accent-champagne" /> GMC
                  Certified
                </span>
              </div>
            </div>

            {/* Subtle radial glow demonstrating depth */}
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
          </div>
        </section>
      </div>
    </div>
  );
}
