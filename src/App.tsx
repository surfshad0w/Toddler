import { useState, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  findItQuestions,
  colorQuestions,
  shapeQuestions,
  generateCountingQuestions,
  generateMathQuestions,
  shuffle,
  type FindItQuestion,
  type CountingQuestion,
  type ColorQuestion,
  type ShapeQuestion,
  type MathQuestion,
} from "./data/gameData";

type GameMode = "menu" | "findit" | "counting" | "colors" | "shapes" | "math" | "done";

function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.65 },
    colors: ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bcb"],
  });
}

function fireBigConfetti() {
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.5 } });
  setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4, x: 0.3 } }), 300);
  setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4, x: 0.7 } }), 600);
}

// ===== MAIN APP =====
export function App() {
  const [mode, setMode] = useState<GameMode>("menu");
  const [totalScore, setTotalScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  const handleGameComplete = useCallback((score: number) => {
    setTotalScore((p) => p + score);
    setGamesPlayed((p) => p + 1);
    setMode("done");
    fireBigConfetti();
  }, []);

  if (mode === "menu") {
    return <MainMenu onSelect={setMode} totalScore={totalScore} gamesPlayed={gamesPlayed} />;
  }
  if (mode === "findit") {
    return <FindItGame onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "counting") {
    return <CountingGame onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "colors") {
    return <ColorGame onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "shapes") {
    return <ShapeGame onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "math") {
    return <MathGame onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "done") {
    return <DoneScreen onMenu={() => setMode("menu")} totalScore={totalScore} />;
  }
  return null;
}

// ===== MAIN MENU =====
function MainMenu({
  onSelect,
  totalScore,
  gamesPlayed,
}: {
  onSelect: (m: GameMode) => void;
  totalScore: number;
  gamesPlayed: number;
}) {
  const games = [
    {
      key: "findit" as GameMode,
      emoji: "🔍",
      title: "Find It!",
      subtitle: "Tap the right emoji!",
      gradient: "from-orange-400 to-pink-500",
      bg: "bg-orange-50",
    },
    {
      key: "counting" as GameMode,
      emoji: "🔢",
      title: "Counting Fun",
      subtitle: "How many can you count?",
      gradient: "from-blue-400 to-cyan-500",
      bg: "bg-blue-50",
    },
    {
      key: "colors" as GameMode,
      emoji: "🎨",
      title: "Color Quiz",
      subtitle: "What color is this?",
      gradient: "from-purple-400 to-pink-500",
      bg: "bg-purple-50",
    },
    {
      key: "shapes" as GameMode,
      emoji: "🔷",
      title: "Shape Match",
      subtitle: "What shape is this?",
      gradient: "from-teal-400 to-emerald-500",
      bg: "bg-teal-50",
    },
    {
      key: "math" as GameMode,
      emoji: "➕",
      title: "Math Fun",
      subtitle: "Add & subtract!",
      gradient: "from-rose-400 to-red-500",
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 px-4 py-8">
      <div className="w-full max-w-md text-center">
        {/* Title */}
        <div className="mb-2 text-6xl animate-bounce">🌟</div>
        <h1 className="mb-1 text-4xl font-extrabold text-purple-600">
          Fun Learning!
        </h1>
        <p className="mb-6 text-lg text-purple-400 font-medium">
          Pick a game to play!
        </p>

        {/* Score badge */}
        {gamesPlayed > 0 && (
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 shadow-md">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-bold text-amber-500">{totalScore} stars</span>
            <span className="text-gray-300">|</span>
            <span className="text-lg font-bold text-purple-400">{gamesPlayed} games</span>
          </div>
        )}

        {/* Game buttons */}
        <div className="space-y-4">
          {games.map((game) => (
            <button
              key={game.key}
              onClick={() => onSelect(game.key)}
              className={`w-full flex items-center gap-4 rounded-3xl ${game.bg} p-5 shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer border-2 border-white/60`}
            >
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient} text-3xl shadow-md`}
              >
                {game.emoji}
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-gray-700">
                  {game.title}
                </h2>
                <p className="text-sm font-medium text-gray-400">
                  {game.subtitle}
                </p>
              </div>
              <div className="ml-auto text-3xl text-gray-300">▶</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== DONE SCREEN =====
function DoneScreen({ onMenu, totalScore }: { onMenu: () => void; totalScore: number }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-7xl animate-bounce">🎉</div>
        <h1 className="mb-2 text-4xl font-extrabold text-purple-600">
          Awesome Job!
        </h1>
        <p className="mb-6 text-xl text-gray-500">You finished the game!</p>
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 p-5">
          <div className="mb-1 text-4xl">{"⭐".repeat(Math.min(totalScore, 20))}</div>
          <p className="text-2xl font-bold text-amber-600">{totalScore} Total Stars!</p>
        </div>
        <button
          onClick={onMenu}
          className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-10 py-4 text-2xl font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          Play More! 🎮
        </button>
      </div>
    </div>
  );
}

// ===== GAME WRAPPER (shared layout) =====
function GameWrapper({
  title,
  emoji,
  current,
  total,
  score,
  onBack,
  bgGradient,
  children,
}: {
  title: string;
  emoji: string;
  current: number;
  total: number;
  score: number;
  onBack: () => void;
  bgGradient: string;
  children: React.ReactNode;
}) {
  const progress = (current / total) * 100;

  return (
    <div className={`flex min-h-screen flex-col items-center ${bgGradient} px-4 py-6`}>
      {/* Header */}
      <div className="mb-4 w-full max-w-md">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            ←
          </button>
          <h1 className="text-xl font-extrabold text-purple-600 sm:text-2xl">
            {emoji} {title}
          </h1>
          <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-md">
            <span className="text-lg">⭐</span>
            <span className="text-lg font-bold text-amber-500">{score}</span>
          </div>
        </div>
        {/* Progress */}
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-center text-sm font-semibold text-purple-400">
          {current} / {total}
        </p>
      </div>

      {/* Content */}
      <div className="w-full max-w-md flex-1 flex items-start justify-center">
        {children}
      </div>
    </div>
  );
}

// ===== FIND IT GAME =====
function FindItGame({
  onComplete,
  onBack,
}: {
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const TOTAL = 8;
  const [questions] = useState<FindItQuestion[]>(() =>
    shuffle(findItQuestions).slice(0, TOTAL).map((q) => ({
      ...q,
      options: shuffle(q.options),
    }))
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[current];

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === question.correctEmoji;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper
      title="Find It!"
      emoji="🔍"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-100"
    >
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Word prompt */}
        <div className="mb-3 text-center">
          <p className="text-xl font-bold text-gray-400 mb-1">Find the...</p>
          <h2 className="text-5xl sm:text-6xl font-extrabold text-orange-500 animate-[popIn_0.4s_ease-out]">
            {question.word}
          </h2>
        </div>

        {/* Question */}
        <p className="mb-6 text-center text-xl font-bold text-gray-500">
          Tap the right emoji! 👇
        </p>

        {/* Emoji options — big buttons */}
        <div className="flex justify-center gap-4 sm:gap-6">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 hover:from-amber-100 hover:to-orange-100 hover:scale-110";
            if (selected) {
              if (option === question.correctEmoji) {
                btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 scale-110 ring-4 ring-green-300";
              } else if (option === selected && !isCorrect) {
                btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 animate-[shake_0.4s_ease-in-out] opacity-60";
              } else {
                btnStyle = "bg-gray-50 border-gray-200 opacity-40";
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!selected}
                className={`flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border-4 text-5xl sm:text-6xl transition-all duration-200 cursor-pointer ${btnStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected && (
          <div className="mt-5 text-center animate-[popIn_0.3s_ease-out]">
            <p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-orange-400"}`}>
              {isCorrect ? "🎉 Great job!" : `It's this one: ${question.correctEmoji}`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}

// ===== COUNTING GAME =====
function CountingGame({
  onComplete,
  onBack,
}: {
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const TOTAL = 8;
  const [questions] = useState<CountingQuestion[]>(() =>
    generateCountingQuestions().slice(0, TOTAL)
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[current];

  // Build the emoji display
  const emojiDisplay = Array.from({ length: question.count }, (_, i) => (
    <span key={i} className="text-4xl sm:text-5xl mx-1 inline-block animate-[popIn_0.3s_ease-out]" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>
      {question.emoji}
    </span>
  ));

  function handleSelect(option: number) {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === question.count;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper
      title="Counting Fun"
      emoji="🔢"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100"
    >
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Emoji grid */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-blue-50 p-6 min-h-[120px]">
          {emojiDisplay}
        </div>

        {/* Question */}
        <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">
          How many <span className="text-blue-500">{question.emoji}</span> do you see?
        </h2>

        {/* Options */}
        <div className="flex justify-center gap-4">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 text-blue-700 hover:from-blue-200 hover:to-cyan-200";
            if (selected !== null) {
              if (option === question.count) {
                btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 text-green-700 scale-110";
              } else if (option === selected && !isCorrect) {
                btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              } else {
                btnStyle = "bg-gray-100 border-gray-200 text-gray-400";
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 text-4xl sm:text-5xl font-extrabold transition-all duration-200 cursor-pointer ${btnStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected !== null && (
          <div className="mt-5 text-center animate-[popIn_0.3s_ease-out]">
            <p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-blue-400"}`}>
              {isCorrect ? "🎉 Correct!" : `There are ${question.count}!`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}

// ===== COLOR GAME =====
function ColorGame({
  onComplete,
  onBack,
}: {
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const TOTAL = 8;
  const [questions] = useState<ColorQuestion[]>(() =>
    shuffle(colorQuestions).slice(0, TOTAL).map(q => ({
      ...q,
      options: shuffle(q.options),
    }))
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[current];

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === question.colorName;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  // Color option button styling
  const colorMap: Record<string, string> = {
    Red: "bg-red-100 border-red-300 text-red-600 hover:bg-red-200",
    Blue: "bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200",
    Green: "bg-green-100 border-green-300 text-green-700 hover:bg-green-200",
    Yellow: "bg-yellow-100 border-yellow-300 text-yellow-600 hover:bg-yellow-200",
    Purple: "bg-purple-100 border-purple-300 text-purple-600 hover:bg-purple-200",
    Orange: "bg-orange-100 border-orange-300 text-orange-600 hover:bg-orange-200",
    Pink: "bg-pink-100 border-pink-300 text-pink-600 hover:bg-pink-200",
    Brown: "bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-200",
    Black: "bg-gray-200 border-gray-500 text-gray-800 hover:bg-gray-300",
    White: "bg-white border-gray-300 text-gray-500 hover:bg-gray-50",
    Gray: "bg-gray-100 border-gray-300 text-gray-500 hover:bg-gray-200",
  };

  return (
    <GameWrapper
      title="Color Quiz"
      emoji="🎨"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-100"
    >
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Colored shape */}
        <div className="mb-4 flex justify-center">
          <div
            className="text-[130px] leading-none sm:text-[160px] animate-[popIn_0.4s_ease-out]"
            style={{
              color: question.colorHex,
              textShadow: question.colorName === "White" ? "0 0 10px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {question.shape}
          </div>
        </div>

        {/* Question */}
        <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">
          What color is this?
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            let btnStyle = colorMap[option] || "bg-gray-100 border-gray-300 text-gray-600";
            if (selected) {
              if (option === question.colorName) {
                btnStyle = "bg-green-100 border-green-400 text-green-700 scale-105";
              } else if (option === selected && !isCorrect) {
                btnStyle = "bg-red-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              } else {
                btnStyle = "bg-gray-50 border-gray-200 text-gray-400";
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!selected}
                className={`w-full rounded-2xl border-3 p-4 text-2xl font-extrabold transition-all duration-200 cursor-pointer sm:text-3xl ${btnStyle}`}
              >
                {option === question.colorName && selected
                  ? `${option} ✅`
                  : option === selected && !isCorrect
                    ? `${option} ❌`
                    : option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected && (
          <div className="mt-4 text-center animate-[popIn_0.3s_ease-out]">
            <p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-purple-400"}`}>
              {isCorrect ? "🎉 Correct!" : `It's ${question.colorName}!`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}

// ===== SVG SHAPE RENDERER =====
function ShapeSVG({ name, size = 160 }: { name: string; size?: number }) {
  const colors: Record<string, { fill: string; stroke: string }> = {
    Circle: { fill: "#3B82F6", stroke: "#2563EB" },
    Square: { fill: "#EF4444", stroke: "#DC2626" },
    Triangle: { fill: "#22C55E", stroke: "#16A34A" },
    Star: { fill: "#EAB308", stroke: "#CA8A04" },
    Heart: { fill: "#EC4899", stroke: "#DB2777" },
    Diamond: { fill: "#A855F7", stroke: "#9333EA" },
    Oval: { fill: "#F97316", stroke: "#EA580C" },
    Rectangle: { fill: "#06B6D4", stroke: "#0891B2" },
    Crescent: { fill: "#FBBF24", stroke: "#D97706" },
    Cross: { fill: "#EF4444", stroke: "#DC2626" },
    Arrow: { fill: "#10B981", stroke: "#059669" },
    Hexagon: { fill: "#8B5CF6", stroke: "#7C3AED" },
  };

  const c = colors[name] || { fill: "#6B7280", stroke: "#4B5563" };
  const s = size;
  const half = s / 2;

  const shapes: Record<string, React.ReactNode> = {
    Circle: (
      <circle cx={half} cy={half} r={half * 0.8} fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Square: (
      <rect x={s * 0.12} y={s * 0.12} width={s * 0.76} height={s * 0.76} rx="8" fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Triangle: (
      <polygon points={`${half},${s * 0.08} ${s * 0.9},${s * 0.88} ${s * 0.1},${s * 0.88}`} fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Star: (
      <polygon
        points={(() => {
          const pts = [];
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? half * 0.85 : half * 0.35;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            pts.push(`${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`);
          }
          return pts.join(" ");
        })()}
        fill={c.fill} stroke={c.stroke} strokeWidth="3"
      />
    ),
    Heart: (
      <path
        d={`M${half},${s * 0.85} C${s * 0.1},${s * 0.55} ${s * 0.0},${s * 0.2} ${half},${s * 0.35} C${s},${s * 0.2} ${s * 0.9},${s * 0.55} ${half},${s * 0.85}Z`}
        fill={c.fill} stroke={c.stroke} strokeWidth="3"
      />
    ),
    Diamond: (
      <polygon points={`${half},${s * 0.05} ${s * 0.9},${half} ${half},${s * 0.95} ${s * 0.1},${half}`} fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Oval: (
      <ellipse cx={half} cy={half} rx={half * 0.85} ry={half * 0.55} fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Rectangle: (
      <rect x={s * 0.08} y={s * 0.22} width={s * 0.84} height={s * 0.56} rx="8" fill={c.fill} stroke={c.stroke} strokeWidth="4" />
    ),
    Crescent: (
      <path
        d={`M${half * 1.1},${s * 0.08} A${half * 0.8},${half * 0.8} 0 1,1 ${half * 1.1},${s * 0.92} A${half * 0.6},${half * 0.7} 0 1,0 ${half * 1.1},${s * 0.08}Z`}
        fill={c.fill} stroke={c.stroke} strokeWidth="3"
      />
    ),
    Cross: (
      <path
        d={`M${s * 0.35},${s * 0.1} h${s * 0.3} v${s * 0.25} h${s * 0.25} v${s * 0.3} h-${s * 0.25} v${s * 0.25} h-${s * 0.3} v-${s * 0.25} h-${s * 0.25} v-${s * 0.3} h${s * 0.25}Z`}
        fill={c.fill} stroke={c.stroke} strokeWidth="3"
      />
    ),
    Arrow: (
      <polygon
        points={`${s * 0.9},${half} ${s * 0.4},${s * 0.1} ${s * 0.4},${s * 0.35} ${s * 0.1},${s * 0.35} ${s * 0.1},${s * 0.65} ${s * 0.4},${s * 0.65} ${s * 0.4},${s * 0.9}`}
        fill={c.fill} stroke={c.stroke} strokeWidth="3"
      />
    ),
    Hexagon: (
      <polygon
        points={(() => {
          const pts = [];
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            pts.push(`${half + half * 0.82 * Math.cos(angle)},${half + half * 0.82 * Math.sin(angle)}`);
          }
          return pts.join(" ");
        })()}
        fill={c.fill} stroke={c.stroke} strokeWidth="4"
      />
    ),
  };

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="drop-shadow-lg animate-[popIn_0.4s_ease-out]">
      {shapes[name] || <circle cx={half} cy={half} r={half * 0.8} fill="#ccc" />}
    </svg>
  );
}

// ===== SHAPE GAME =====
function ShapeGame({
  onComplete,
  onBack,
}: {
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const TOTAL = 8;
  const [questions] = useState<ShapeQuestion[]>(() =>
    shuffle(shapeQuestions).slice(0, TOTAL).map((q) => ({
      ...q,
      options: shuffle(q.options),
    }))
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[current];

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === question.shapeName;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  // Shape-themed button colors
  const shapeColorMap: Record<string, string> = {
    Circle: "bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100",
    Square: "bg-red-50 border-red-300 text-red-600 hover:bg-red-100",
    Triangle: "bg-green-50 border-green-300 text-green-600 hover:bg-green-100",
    Star: "bg-yellow-50 border-yellow-300 text-yellow-600 hover:bg-yellow-100",
    Heart: "bg-pink-50 border-pink-300 text-pink-600 hover:bg-pink-100",
    Diamond: "bg-purple-50 border-purple-300 text-purple-600 hover:bg-purple-100",
    Oval: "bg-orange-50 border-orange-300 text-orange-600 hover:bg-orange-100",
    Rectangle: "bg-cyan-50 border-cyan-300 text-cyan-600 hover:bg-cyan-100",
    Crescent: "bg-amber-50 border-amber-300 text-amber-600 hover:bg-amber-100",
    Cross: "bg-red-50 border-red-300 text-red-600 hover:bg-red-100",
    Arrow: "bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100",
    Hexagon: "bg-violet-50 border-violet-300 text-violet-600 hover:bg-violet-100",
    Pentagon: "bg-indigo-50 border-indigo-300 text-indigo-600 hover:bg-indigo-100",
  };

  return (
    <GameWrapper
      title="Shape Match"
      emoji="🔷"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-100"
    >
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Shape display */}
        <div className="mb-4 flex justify-center">
          <ShapeSVG name={question.shapeName} size={160} />
        </div>

        {/* Question */}
        <h2 className="mb-6 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">
          What shape is this?
        </h2>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            let btnStyle = shapeColorMap[option] || "bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100";
            if (selected) {
              if (option === question.shapeName) {
                btnStyle = "bg-green-100 border-green-400 text-green-700 scale-105";
              } else if (option === selected && !isCorrect) {
                btnStyle = "bg-red-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              } else {
                btnStyle = "bg-gray-50 border-gray-200 text-gray-400";
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={!!selected}
                className={`w-full rounded-2xl border-3 p-4 text-2xl font-extrabold transition-all duration-200 cursor-pointer sm:text-3xl ${btnStyle}`}
              >
                {option === question.shapeName && selected
                  ? `${option} ✅`
                  : option === selected && !isCorrect
                    ? `${option} ❌`
                    : option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected && (
          <div className="mt-4 text-center animate-[popIn_0.3s_ease-out]">
            <p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-teal-400"}`}>
              {isCorrect ? "🎉 Correct!" : `It's a ${question.shapeName}!`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}

// ===== MATH GAME =====
function MathGame({
  onComplete,
  onBack,
}: {
  onComplete: (score: number) => void;
  onBack: () => void;
}) {
  const TOTAL = 8;
  const [questions] = useState<MathQuestion[]>(() =>
    generateMathQuestions().slice(0, TOTAL)
  );
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const question = questions[current];

  // Build emoji visual: show group1 OP group2
  const group1Emojis = Array.from({ length: question.num1 }, (_, i) => (
    <span
      key={`a${i}`}
      className="text-3xl sm:text-4xl inline-block animate-[popIn_0.3s_ease-out]"
      style={{ animationDelay: `${i * 0.06}s`, animationFillMode: "both" }}
    >
      {question.emoji}
    </span>
  ));

  const group2Emojis = Array.from({ length: question.num2 }, (_, i) => (
    <span
      key={`b${i}`}
      className={`text-3xl sm:text-4xl inline-block animate-[popIn_0.3s_ease-out] ${question.operator === "−" ? "opacity-40 line-through" : ""}`}
      style={{ animationDelay: `${(question.num1 + i) * 0.06}s`, animationFillMode: "both" }}
    >
      {question.emoji}
    </span>
  ));

  function handleSelect(option: number) {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === question.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) {
        onComplete(score + (correct ? 1 : 0));
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper
      title="Math Fun"
      emoji="➕"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-rose-50 via-red-50 to-orange-100"
    >
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        {/* Emoji visual helper */}
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 min-h-[80px]">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <div className="flex flex-wrap justify-center gap-1">
              {group1Emojis}
            </div>
            <span className="text-4xl sm:text-5xl font-extrabold text-rose-400 mx-2">
              {question.operator}
            </span>
            <div className="flex flex-wrap justify-center gap-1">
              {group2Emojis}
            </div>
          </div>
        </div>

        {/* Math equation in numbers */}
        <h2 className="mb-6 text-center text-4xl sm:text-5xl font-extrabold text-gray-700 animate-[popIn_0.4s_ease-out]">
          <span className="text-rose-500">{question.num1}</span>
          <span className="text-rose-400 mx-3">{question.operator}</span>
          <span className="text-rose-500">{question.num2}</span>
          <span className="text-gray-400 mx-3">=</span>
          <span className="text-rose-300">?</span>
        </h2>

        {/* Options */}
        <div className="flex justify-center gap-4">
          {question.options.map((option) => {
            let btnStyle =
              "bg-gradient-to-br from-rose-100 to-red-100 border-rose-300 text-rose-700 hover:from-rose-200 hover:to-red-200";
            if (selected !== null) {
              if (option === question.answer) {
                btnStyle =
                  "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 text-green-700 scale-110";
              } else if (option === selected && !isCorrect) {
                btnStyle =
                  "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              } else {
                btnStyle = "bg-gray-100 border-gray-200 text-gray-400";
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className={`flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 text-4xl sm:text-5xl font-extrabold transition-all duration-200 cursor-pointer ${btnStyle}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected !== null && (
          <div className="mt-5 text-center animate-[popIn_0.3s_ease-out]">
            <p
              className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-rose-400"}`}
            >
              {isCorrect
                ? "🎉 Correct!"
                : `${question.num1} ${question.operator} ${question.num2} = ${question.answer}`}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
