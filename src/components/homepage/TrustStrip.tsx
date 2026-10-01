export function TrustStrip() {
  return (
    <div className="w-full border-y border-zinc-800 bg-zinc-950/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-zinc-400 text-sm font-medium mb-4">
          Pensato per ogni business che vive nel mondo reale.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm text-zinc-500 font-medium">
          <span>Ristoranti</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Bar</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Hotel</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Retail</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Hospitality</span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span>Servizi</span>
        </div>
      </div>
    </div>
  );
}
