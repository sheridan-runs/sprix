import { useState, useEffect } from 'react';
import { Flag, Timer, Trophy, Download, ChevronDown, ChevronUp, Info, Zap, ExternalLink, Scissors, CheckSquare, ClipboardList } from 'lucide-react';
import { calculateSplits, secondsToTime, timeToSeconds } from './utils/raceMath';
import { downloadPDF } from './utils/pdfGenerator';
import type { Split as SplitType } from './utils/raceMath';

function App() {
  // --- State ---
  const [distance, setDistance] = useState<number>(42.195);
  const [hours, setHours] = useState(4);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [strategy, setStrategy] = useState<'even' | 'negative'>('even');
  const [splits, setSplits] = useState<SplitType[]>([]);
  const [avgPace, setAvgPace] = useState<string>('0:00');
  const [showAllSplits, setShowAllSplits] = useState<boolean>(false);

  const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const presets = [
    { label: '5k', km: 5, defaultTime: { h: 0, m: 25, s: 0 } },
    { label: '10k', km: 10, defaultTime: { h: 0, m: 50, s: 0 } },
    { label: 'Half', km: 21.0975, defaultTime: { h: 1, m: 50, s: 0 } },
    { label: 'Marathon', km: 42.195, defaultTime: { h: 4, m: 0, s: 0 } },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    setDistance(preset.km);
    setHours(preset.defaultTime.h);
    setMinutes(preset.defaultTime.m);
    setSeconds(preset.defaultTime.s);
  };

  useEffect(() => {
    const calculatedSplits = calculateSplits(distance, timeStr, strategy);
    setSplits(calculatedSplits);

    const totalSeconds = timeToSeconds(timeStr);
    if (distance > 0 && totalSeconds > 0) {
      const paceSeconds = totalSeconds / distance;
      setAvgPace(secondsToTime(paceSeconds));
    }
    
    // Auto-reset view mode: Short races show all, Long races show summary
    if (distance <= 15) {
      setShowAllSplits(true);
    } else {
      setShowAllSplits(false);
    }
  }, [distance, timeStr, strategy]);

  // Screen Logic: What the user sees on the website
  const visibleSplits = (distance > 15 && !showAllSplits)
    ? splits.filter(s => s.isMajorMarker || s.distance === distance)
    : splits;

  // Print Logic: The "Safety Valve"
  // Max rows that fit on A4 with headers/footers is approx 44.
  // If the user tries to print >44 rows, we force the "Summary" view to prevent cutoff.
  const MAX_PRINTABLE_ROWS = 44;
  const splitsToPrint = visibleSplits.length > MAX_PRINTABLE_ROWS 
    ? splits.filter(s => s.isMajorMarker || s.distance === distance) 
    : visibleSplits;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-red-600 selection:text-white flex flex-col">
      
      {/* --- Header --- */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center transform -skew-x-12">
              <Flag className="text-white w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight text-white italic block leading-none">SPRIX</span>
              <span className="text-[10px] text-slate-500 font-mono leading-none block">/spriː/</span>
            </div>
          </div>
          <div className="hidden sm:block text-xs font-mono text-slate-500">BETA v0.3</div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-10 flex-grow w-full">
        {/* HERO */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white">
            RACE <span className="text-red-600">SMARTER.</span>
          </h1>
          <p className="text-slate-400 max-w-md mx-auto text-lg leading-relaxed">
            Calculate your perfect splits, visualize your marathon strategy, and print your race-day wristband.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 mt-2">
            <Info className="w-3 h-3" />
            <span>Sprix: Like "Prix" in Grand Prix</span>
          </div>
        </div>

        {/* CONTROLS */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="space-y-3 relative z-0">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
              <Flag className="w-4 h-4" /> Race Distance
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border ${
                    distance === p.km ? 'bg-red-600 border-red-600 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="relative group">
              <input type="number" value={distance} onChange={(e) => setDistance(parseFloat(e.target.value) || 0)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-lg focus:outline-none focus:border-red-500 transition-colors" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-sm font-mono pointer-events-none">KM</div>
            </div>
          </div>

          <div className="space-y-3 relative z-0">
            <label className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4" /> Goal Time
            </label>
            <div className="flex items-center gap-2">
               <div className="relative flex-1">
                 <input type="number" min="0" value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-center text-white font-mono text-lg focus:border-red-500 focus:outline-none" />
                 <span className="absolute bottom-1 left-0 right-0 text-[8px] text-center text-slate-600 uppercase">Hrs</span>
               </div>
               <span className="text-slate-600 font-mono text-xl pb-2">:</span>
               <div className="relative flex-1">
                 <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-center text-white font-mono text-lg focus:border-red-500 focus:outline-none" />
                 <span className="absolute bottom-1 left-0 right-0 text-[8px] text-center text-slate-600 uppercase">Mins</span>
               </div>
               <span className="text-slate-600 font-mono text-xl pb-2">:</span>
               <div className="relative flex-1">
                 <input type="number" min="0" max="59" value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-center text-white font-mono text-lg focus:border-red-500 focus:outline-none" />
                 <span className="absolute bottom-1 left-0 right-0 text-[8px] text-center text-slate-600 uppercase">Secs</span>
               </div>
            </div>
          </div>

          <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${strategy === 'negative' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-500'}`}>
                <Zap className="w-5 h-5" fill={strategy === 'negative' ? "currentColor" : "none"} />
              </div>
              <div>
                <div className="text-sm font-medium text-white">Negative Split</div>
                <div className="text-xs text-slate-500">Start slower, finish faster</div>
              </div>
            </div>
            <button 
              onClick={() => setStrategy(strategy === 'even' ? 'negative' : 'even')}
              className={`w-12 h-6 rounded-full p-1 transition-colors relative ${strategy === 'negative' ? 'bg-red-600' : 'bg-slate-700'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${strategy === 'negative' ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </section>

        {/* SUMMARY & DOWNLOAD */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
             <span className="text-slate-500 text-xs uppercase tracking-widest mb-1">Avg Pace</span>
             <span className="text-2xl font-bold text-white font-mono">{avgPace} <span className="text-sm text-slate-500">/km</span></span>
          </div>
          <button 
            onClick={() => downloadPDF('printable-race-plan', 'sprix-race-kit.pdf')}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-slate-700 transition-colors group cursor-pointer"
          >
             <Download className="w-6 h-6 text-slate-400 mb-1 group-hover:text-red-500 transition-colors" />
             <span className="text-slate-400 text-xs uppercase tracking-widest group-hover:text-white transition-colors">Download Kit</span>
          </button>
        </div>

        {/* SCREEN DISPLAY */}
        <section className="bg-white text-black rounded-lg shadow-2xl relative flex flex-col">
          <div className="bg-red-600 text-white p-3 flex justify-between items-center shrink-0 rounded-t-lg z-10">
            <span className="font-bold italic tracking-tight">SPRIX</span>
            <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-semibold">{timeStr} GOAL</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 bg-slate-100 p-2 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-300 shrink-0">
            <div className="text-center">Dist</div>
            <div className="text-center">Split</div>
            <div className="text-center">Elapsed</div>
          </div>
          
          <div className={`divide-y divide-slate-200 font-mono text-sm overflow-y-auto transition-all ${showAllSplits ? 'max-h-none' : 'max-h-[400px]'}`}>
            {visibleSplits.map((split) => (
              <div key={split.distance} className={`grid grid-cols-3 py-2 ${split.isMajorMarker ? 'bg-slate-50 font-bold' : ''}`}>
                <div className="text-center flex items-center justify-center gap-1">
                  {split.distance}<span className="text-[10px] text-slate-400">km</span>
                  {split.isMajorMarker && <Trophy className="w-3 h-3 text-red-600" />}
                </div>
                <div className="text-center text-slate-500">{split.splitTime}</div>
                <div className="text-center font-semibold text-slate-900">{split.elapsedTime}</div>
              </div>
            ))}
          </div>

          {distance > 15 && (
            <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 p-2 z-10">
                <button 
                    onClick={() => setShowAllSplits(!showAllSplits)}
                    className="w-full py-3 rounded-lg bg-slate-50 text-xs uppercase tracking-widest text-slate-600 hover:text-red-600 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 font-semibold"
                >
                    {showAllSplits ? (
                        <>Show Summary <ChevronUp className="w-3 h-3" /></>
                    ) : (
                        <>Show All Splits <ChevronDown className="w-3 h-3" /></>
                    )}
                </button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-8 mt-10">
        <div className="max-w-2xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-slate-400">
             <span className="text-sm">Built by</span>
             <a href="https://runwith.club" target="_blank" rel="noopener noreferrer" className="text-white font-bold hover:text-red-500 transition-colors flex items-center gap-1">
               Run With Run Club <ExternalLink className="w-3 h-3" />
             </a>
          </div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">© {new Date().getFullYear()} Sprix. Run Fast.</p>
        </div>
      </footer>

      {/* --- RACE DAY KIT (HIDDEN A4 LAYOUT) --- */}
      <div 
        id="printable-race-plan" 
        className="fixed -left-[9999px] top-0 w-[794px] min-h-[1123px] bg-[#ffffff] text-[#000000] p-8 flex gap-8"
      >
        {/* COLUMN 1: THE PACE BAND */}
        <div className="w-[30%] flex flex-col">
            <div className="border-2 border-[#000000] border-dashed p-1 flex-grow">
                {/* Band Header */}
                <div className="bg-[#000000] text-[#ffffff] p-2 text-center border-b-2 border-[#000000] mb-1">
                    <div className="text-3xl font-bold italic tracking-tight leading-none">SPRIX</div>
                    <div className="mt-2 text-xl font-mono font-bold">{timeStr}</div>
                    <div className="text-[10px] uppercase text-[#9ca3af] tracking-wider mt-1">
                        {strategy === 'negative' ? 'Negative Split' : 'Even Pace'}
                    </div>
                </div>

                {/* Band Data */}
                <div className="text-[11px] font-mono leading-none">
                    <div className="grid grid-cols-3 bg-[#e5e7eb] font-bold py-1 border-b border-[#000000] mb-1">
                        <div className="text-center">KM</div>
                        <div className="text-center">PACE</div>
                        <div className="text-center">TIME</div>
                    </div>
                    {splitsToPrint.map((split, i) => (
                        <div key={split.distance} className={`grid grid-cols-3 py-[3px] border-b border-[#f3f4f6] ${i % 2 === 0 ? 'bg-[#ffffff]' : 'bg-[#f9fafb]'} ${split.isMajorMarker ? 'border-b border-[#000000] font-bold bg-[#e5e7eb]' : ''}`}>
                            <div className="text-center relative">{split.distance}{split.isMajorMarker && <span className="absolute left-1 top-0.5 text-[6px] text-[#000000]">●</span>}</div>
                            <div className="text-center text-[#4b5563]">{split.splitTime}</div>
                            <div className="text-center font-bold">{split.elapsedTime}</div>
                        </div>
                    ))}
                </div>
                <div className="text-center pt-2 mt-auto">
                    <div className="text-[8px] font-bold uppercase tracking-widest text-[#9ca3af]">sprix.run</div>
                </div>
            </div>
            <div className="text-center mt-2 flex items-center justify-center gap-1 text-[#6b7280] text-sm">
                <Scissors className="w-4 h-4" /> <span>Cut along dashed line</span>
            </div>
        </div>

        {/* COLUMN 2: THE INSTRUCTIONS & CHECKLIST */}
        <div className="flex-1 space-y-8 pt-4">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-black italic tracking-tighter text-[#000000]">RACE DAY <span className="text-[#dc2626]">PLAN</span></h1>
                <p className="text-xl text-[#4b5563] mt-2">Target Goal: <span className="font-bold text-[#000000]">{timeStr}</span></p>
                <div className="h-1 w-full bg-[#000000] mt-4"></div>
            </div>

            {/* Instructions (Fixed Alignment) */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" /> Instructions
                </h2>
                <div className="grid grid-cols-1 gap-4 text-sm text-[#374151]">
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-[#ffffff] flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">1</div>
                        <p className="leading-tight"><strong>Print & Cut:</strong> Cut out the pace band on the left along the dotted lines. Trim the width if needed to fit your arm.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-[#ffffff] flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">2</div>
                        <p className="leading-tight"><strong>Waterproof:</strong> Cover the strip completely with clear packing tape (front and back) to protect it from sweat and rain.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#000000] text-[#ffffff] flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">3</div>
                        <p className="leading-tight"><strong>Wear:</strong> Loop it around your wrist and tape the ends together. Ensure it's loose enough to be comfortable but tight enough not to slip.</p>
                    </div>
                </div>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" /> Race Morning Checklist
                </h2>
                <div className="border border-[#e5e7eb] rounded-lg p-6 bg-[#f9fafb]">
                    <div className="grid grid-cols-2 gap-4">
                        {['Running Shoes (Double Knotted)', 'Race Bib & Safety Pins', 'Timing Chip', 'GPS Watch (Charged)', 'Gels / Nutrition', 'Anti-Chafe Balm', 'Sunscreen / Hat', 'Post-Race Warm Clothes'].map(item => (
                            <div key={item} className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#d1d5db] rounded shrink-0"></div>
                                <span className="text-sm text-[#374151]">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Strategy */}
            <div className="bg-[#fef2f2] p-6 rounded-lg border border-[#fee2e2]">
                <h3 className="text-[#dc2626] font-bold text-lg mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Strategy Note
                </h3>
                <p className="text-sm text-[#7f1d1d] leading-relaxed">
                    {strategy === 'negative' 
                        ? "You are running a NEGATIVE SPLIT strategy. This means starting conservatively. It will feel 'too slow' at the start—trust the plan. Save your energy for the final 10km where you will overtake fading runners."
                        : "You are running an EVEN PACE strategy. Consistency is key. Avoid the temptation to sprint the first few kilometers. Lock into your target pace early and hold it as steady as a metronome."
                    }
                </p>
            </div>

            {/* Footer Branding */}
            <div className="mt-auto pt-10 text-center">
                <p className="text-xs text-[#9ca3af] uppercase tracking-widest">Powered by</p>
                <p className="font-bold text-lg">Run With Run Club</p>
                <p className="text-xs text-[#d1d5db]">runwith.club</p>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;