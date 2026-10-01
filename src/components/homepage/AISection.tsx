import { Wine, Sparkles, MessageSquare } from 'lucide-react';

export default function AISection() {
  return (
    <section className="py-24 bg-[#121214]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-[#f4f4f5] mb-6">
            Intelligenza dove serve.
          </h2>
          <p className="text-xl text-zinc-400">
            L'AI in RIVO non è un gadget. È uno strumento concreto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* AI Sommelier */}
          <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 flex flex-col h-full hover:border-lime-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-lime-400 mb-6">
              <Wine size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-3">AI Sommelier</h3>
            <p className="text-zinc-400 mb-8 flex-1">
              Il tuo sommelier virtuale. Consiglia vini e abbinamenti ai clienti del ristorante, direttamente dal tavolo.
            </p>
            <div className="bg-[#09090B] border border-zinc-800 rounded-lg p-4 text-sm">
              <div className="flex gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-zinc-800 shrink-0"></div>
                <div className="bg-zinc-800 rounded-r-lg rounded-bl-lg px-3 py-2 text-zinc-300 text-xs">
                  Ho preso il branzino al sale, che vino mi consigli?
                </div>
              </div>
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-6 h-6 rounded-full bg-lime-500/20 text-lime-500 flex items-center justify-center shrink-0">
                  <Sparkles size={12} />
                </div>
                <div className="bg-lime-500/10 border border-lime-500/20 rounded-l-lg rounded-br-lg px-3 py-2 text-zinc-300 text-xs">
                  Ti consiglio un Vermentino ligure o un Greco di Tufo per esaltare la delicatezza del pesce.
                </div>
              </div>
            </div>
          </div>

          {/* AI Dish Enhancer */}
          <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 flex flex-col h-full hover:border-lime-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-lime-400 mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-3">AI Dish Enhancer</h3>
            <p className="text-zinc-400 mb-8 flex-1">
              Trasforma nomi di piatti in descrizioni eleganti e rileva automaticamente allergeni.
            </p>
            <div className="bg-[#09090B] border border-zinc-800 rounded-lg p-4 text-sm relative">
              <div className="text-zinc-500 line-through decoration-zinc-600 mb-2">Spaghetti al pomodoro</div>
              <div className="absolute left-6 top-7 w-px h-4 bg-zinc-800"></div>
              <div className="text-lime-400 font-medium">Spaghetto di Gragnano IGP</div>
              <div className="text-zinc-300 text-xs mt-1">con datterini confit, basilico fresco e spuma di bufala.</div>
              <div className="flex gap-2 mt-3">
                <span className="text-[10px] uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Glutine</span>
                <span className="text-[10px] uppercase bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">Lattosio</span>
              </div>
            </div>
          </div>

          {/* AI Review Assistant */}
          <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 flex flex-col h-full hover:border-lime-500/30 transition-colors">
            <div className="w-12 h-12 rounded-lg bg-zinc-800/50 border border-zinc-700 flex items-center justify-center text-lime-400 mb-6">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-3">AI Review Assistant</h3>
            <p className="text-zinc-400 mb-8 flex-1">
              Aiuta i clienti soddisfatti a scrivere recensioni dettagliate su Google, aumentando il tuo rating.
            </p>
            <div className="bg-[#09090B] border border-zinc-800 rounded-lg p-4 text-sm">
              <div className="flex gap-2 mb-3 flex-wrap">
                <span className="px-2 py-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded-md text-xs cursor-default">Ottimo servizio</span>
                <span className="px-2 py-1 bg-lime-500/10 text-lime-400 border border-lime-500/20 rounded-md text-xs cursor-default">Atmosfera top</span>
              </div>
              <div className="p-3 border border-zinc-800 rounded bg-[#18181B] text-zinc-300 text-xs relative">
                "Ho passato una serata meravigliosa. Il servizio è stato eccellente e l'atmosfera del locale era semplicemente fantastica..."
                <div className="absolute right-2 bottom-2 text-lime-500/50">
                  <Sparkles size={14} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
