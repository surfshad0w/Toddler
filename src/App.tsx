import { useEffect, useMemo, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  findItQuestions,
  colorQuestions,
  shapeQuestions,
  generateCountingQuestions,
  generateMathQuestions,
  generatePatternQuestions,
  generateCompareQuestions,
  shuffle,
  type FindItQuestion,
  type CountingQuestion,
  type ColorQuestion,
  type ShapeQuestion,
  type MathQuestion,
  type PatternQuestion,
  type CompareQuestion,
} from "./data/gameData";

type Difficulty = "easy" | "medium" | "hard";
type GameMode = "menu" | "findit" | "counting" | "colors" | "shapes" | "math" | "pattern" | "compare" | "phonics" | "bubbles" | "done";

type ProgressRecord = Record<GameMode, Record<Difficulty, number>>;
type Achievement = {
  id: string;
  label: string;
  emoji: string;
  unlocked: boolean;
};

type PhonicsQuestion = {
  prompt: string;
  choices: { label: string; emoji: string }[];
  answer: string;
  hint: string;
};

const STORAGE_KEY = "toddler-site-progress-v2";
const difficulties: Difficulty[] = ["easy", "medium", "hard"];
const playableModes: GameMode[] = ["findit", "counting", "colors", "shapes", "math", "pattern", "compare", "phonics", "bubbles"];

const difficultyLabels: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const difficultyDescriptions: Record<Difficulty, string> = {
  easy: "Warm-up level",
  medium: "A little trickier",
  hard: "Challenge mode",
};

const modeEmoji: Record<GameMode, string> = {
  menu: "🏠",
  findit: "🔍",
  counting: "🔢",
  colors: "🎨",
  shapes: "🔷",
  math: "➕",
  pattern: "🧩",
  compare: "📏",
  phonics: "📚",
  bubbles: "🫧",
  done: "🎉",
};

const modeTitles: Record<GameMode, string> = {
  menu: "Menu",
  findit: "Find It!",
  counting: "Counting Fun",
  colors: "Color Quiz",
  shapes: "Shape Match",
  math: "Math Fun",
  pattern: "Pattern Fun",
  compare: "Compare Numbers",
  phonics: "Phonics Fun",
  bubbles: "Bubble Pop",
  done: "Done",
};

const phonicsQuestions: PhonicsQuestion[] = [
  {
    prompt: "Which word starts with B?",
    answer: "Ball",
    hint: "B says /b/ like ball.",
    choices: [
      { label: "Ball", emoji: "⚽" },
      { label: "Sun", emoji: "☀️" },
      { label: "Cat", emoji: "🐱" },
    ],
  },
  {
    prompt: "Which word starts with S?",
    answer: "Sun",
    hint: "S says /s/ like sun.",
    choices: [
      { label: "Dog", emoji: "🐶" },
      { label: "Sun", emoji: "☀️" },
      { label: "Fish", emoji: "🐟" },
    ],
  },
  {
    prompt: "Which word starts with M?",
    answer: "Moon",
    hint: "M says /m/ like moon.",
    choices: [
      { label: "Moon", emoji: "🌙" },
      { label: "Tree", emoji: "🌲" },
      { label: "Cake", emoji: "🎂" },
    ],
  },
  {
    prompt: "Which word starts with F?",
    answer: "Fish",
    hint: "F says /f/ like fish.",
    choices: [
      { label: "Car", emoji: "🚗" },
      { label: "Fish", emoji: "🐟" },
      { label: "Apple", emoji: "🍎" },
    ],
  },
  {
    prompt: "Which word starts with R?",
    answer: "Rabbit",
    hint: "R says /r/ like rabbit.",
    choices: [
      { label: "Rabbit", emoji: "🐰" },
      { label: "Banana", emoji: "🍌" },
      { label: "Heart", emoji: "❤️" },
    ],
  },
  {
    prompt: "Which word starts with T?",
    answer: "Tree",
    hint: "T says /t/ like tree.",
    choices: [
      { label: "Tree", emoji: "🌲" },
      { label: "Balloon", emoji: "🎈" },
      { label: "Dog", emoji: "🐶" },
    ],
  },
  {
    prompt: "Which word starts with C?",
    answer: "Cat",
    hint: "C says /k/ like cat.",
    choices: [
      { label: "Cat", emoji: "🐱" },
      { label: "Moon", emoji: "🌙" },
      { label: "Flower", emoji: "🌸" },
    ],
  },
  {
    prompt: "Which word starts with A?",
    answer: "Apple",
    hint: "A says /a/ like apple.",
    choices: [
      { label: "Apple", emoji: "🍎" },
      { label: "Bird", emoji: "🐦" },
      { label: "Pizza", emoji: "🍕" },
    ],
  },
  {
    prompt: "Which word rhymes with CAT?",
    answer: "Hat",
    hint: "Cat and hat have the same ending sound.",
    choices: [
      { label: "Hat", emoji: "🎩" },
      { label: "Sun", emoji: "☀️" },
      { label: "Dog", emoji: "🐶" },
    ],
  },
  {
    prompt: "Which word rhymes with DOG?",
    answer: "Log",
    hint: "Dog and log rhyme because they end the same way.",
    choices: [
      { label: "Fish", emoji: "🐟" },
      { label: "Log", emoji: "🪵" },
      { label: "Star", emoji: "⭐" },
    ],
  },
  {
    prompt: "Which word rhymes with SUN?",
    answer: "Fun",
    hint: "Sun and fun rhyme.",
    choices: [
      { label: "Fun", emoji: "🎉" },
      { label: "Tree", emoji: "🌲" },
      { label: "Cake", emoji: "🎂" },
    ],
  },
  {
    prompt: "Which word rhymes with FISH?",
    answer: "Dish",
    hint: "Fish and dish rhyme.",
    choices: [
      { label: "Dish", emoji: "🍽️" },
      { label: "Moon", emoji: "🌙" },
      { label: "Ball", emoji: "⚽" },
    ],
  },
];

function getDefaultProgress(): ProgressRecord {
  const record = {} as ProgressRecord;
  playableModes.forEach((mode) => {
    record[mode] = { easy: 0, medium: 0, hard: 0 };
  });
  return record;
}

function getAchievementState(progress: ProgressRecord): Achievement[] {
  const bestMath = Math.max(...difficulties.map((d) => progress.math[d] ?? 0));
  const bestPattern = Math.max(...difficulties.map((d) => progress.pattern[d] ?? 0));
  const bestCompare = Math.max(...difficulties.map((d) => progress.compare[d] ?? 0));
  const bestPhonics = Math.max(...difficulties.map((d) => progress.phonics[d] ?? 0));
  const bestBubbles = Math.max(...difficulties.map((d) => progress.bubbles?.[d] ?? 0));
  const masteredGames = playableModes.filter((mode) => Object.values(progress[mode]).some((score) => score >= 8)).length;

  return [
    { id: "math-star", label: "Math Star", emoji: "➕", unlocked: bestMath >= 6 },
    { id: "pattern-detective", label: "Pattern Detective", emoji: "🧩", unlocked: bestPattern >= 6 },
    { id: "compare-captain", label: "Compare Captain", emoji: "📏", unlocked: bestCompare >= 6 },
    { id: "reading-rockstar", label: "Reading Rockstar", emoji: "📚", unlocked: bestPhonics >= 6 },
    { id: "bubble-master", label: "Bubble Master", emoji: "🫧", unlocked: bestBubbles >= 6 },
    { id: "super-learner", label: "Super Learner", emoji: "🌟", unlocked: masteredGames >= 4 },
  ];
}

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

function getStarRating(score: number, total: number) {
  if (score >= total) return 3;
  if (score >= Math.ceil(total * 0.75)) return 2;
  if (score >= Math.ceil(total * 0.4)) return 1;
  return 0;
}

function getEncouragement(score: number, total: number) {
  if (score === total) return "Perfect score, amazing work!";
  if (score >= Math.ceil(total * 0.75)) return "Awesome job, you really know this!";
  if (score >= Math.ceil(total * 0.4)) return "Nice work, keep going!";
  return "Good try, let’s practice more!";
}

function getDifficultyMultiplier(difficulty: Difficulty) {
  if (difficulty === "hard") return 3;
  if (difficulty === "medium") return 2;
  return 1;
}

function usePersistentProgress() {
  const [progress, setProgress] = useState<ProgressRecord>(() => {
    if (typeof window === "undefined") return getDefaultProgress();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultProgress();
      return { ...getDefaultProgress(), ...JSON.parse(raw) };
    } catch {
      return getDefaultProgress();
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore storage issues
    }
  }, [progress]);

  return [progress, setProgress] as const;
}

export function App() {
  const [mode, setMode] = useState<GameMode>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [lastGameScore, setLastGameScore] = useState(0);
  const [lastGameTotal, setLastGameTotal] = useState(0);
  const [progress, setProgress] = usePersistentProgress();

  const achievements = useMemo(() => getAchievementState(progress), [progress]);
  const totalScore = useMemo(() => playableModes.reduce((sum, game) => sum + Object.values(progress[game]).reduce((a, b) => a + b, 0), 0), [progress]);
  const gamesPlayed = useMemo(() => playableModes.reduce((sum, game) => sum + difficulties.filter((d) => progress[game][d] > 0).length, 0), [progress]);

  const handleGameComplete = useCallback((score: number, total: number) => {
    setLastGameScore(score);
    setLastGameTotal(total);
    setProgress((prev) => {
      if (!playableModes.includes(mode)) return prev;
      const next = { ...prev, [mode]: { ...prev[mode] } };
      next[mode][difficulty] = Math.max(prev[mode][difficulty], score);
      return next;
    });
    setMode("done");
    fireBigConfetti();
  }, [difficulty, mode, setProgress]);

  if (mode === "menu") {
    return (
      <MainMenu
        onSelect={setMode}
        totalScore={totalScore}
        gamesPlayed={gamesPlayed}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        progress={progress}
        achievements={achievements}
      />
    );
  }
  if (mode === "findit") {
    return <FindItGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "counting") {
    return <CountingGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "colors") {
    return <ColorGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "shapes") {
    return <ShapeGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "math") {
    return <MathGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "pattern") {
    return <PatternGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "compare") {
    return <CompareGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "phonics") {
    return <PhonicsGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "bubbles") {
    return <BubblePopGame difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
  }
  if (mode === "done") {
    return (
      <DoneScreen
        onMenu={() => setMode("menu")}
        totalScore={totalScore}
        lastGameScore={lastGameScore}
        lastGameTotal={lastGameTotal}
        difficulty={difficulty}
      />
    );
  }
  return null;
}

function MainMenu({
  onSelect,
  totalScore,
  gamesPlayed,
  difficulty,
  onDifficultyChange,
  progress,
  achievements,
}: {
  onSelect: (m: GameMode) => void;
  totalScore: number;
  gamesPlayed: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  progress: ProgressRecord;
  achievements: Achievement[];
}) {
  const games = [
    { key: "findit" as GameMode, emoji: "🔍", title: "Find It!", subtitle: "Vocabulary and picture matching", gradient: "from-orange-400 to-pink-500", bg: "bg-orange-50" },
    { key: "counting" as GameMode, emoji: "🔢", title: "Counting Fun", subtitle: "Count, group, and make 10", gradient: "from-blue-400 to-cyan-500", bg: "bg-blue-50" },
    { key: "colors" as GameMode, emoji: "🎨", title: "Color Quiz", subtitle: "Colors, shades, and shape clues", gradient: "from-purple-400 to-pink-500", bg: "bg-purple-50" },
    { key: "shapes" as GameMode, emoji: "🔷", title: "Shape Match", subtitle: "Names, sides, and real-world clues", gradient: "from-teal-400 to-emerald-500", bg: "bg-teal-50" },
    { key: "math" as GameMode, emoji: "➕", title: "Math Fun", subtitle: "Add, subtract, and fill in the blank", gradient: "from-rose-400 to-red-500", bg: "bg-rose-50" },
    { key: "pattern" as GameMode, emoji: "🧩", title: "Pattern Fun", subtitle: "AB, AAB, ABC, and more", gradient: "from-indigo-400 to-violet-500", bg: "bg-indigo-50" },
    { key: "compare" as GameMode, emoji: "📏", title: "Compare Numbers", subtitle: "Greater, less, equal, and ordering", gradient: "from-amber-400 to-yellow-500", bg: "bg-amber-50" },
    { key: "phonics" as GameMode, emoji: "📚", title: "Phonics Fun", subtitle: "Beginning sounds and rhymes", gradient: "from-lime-400 to-green-500", bg: "bg-lime-50" },
    { key: "bubbles" as GameMode, emoji: "🫧", title: "Bubble Pop", subtitle: "Pop the letter bubbles!", gradient: "from-sky-400 to-blue-500", bg: "bg-sky-50" },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 px-4 py-8">
      <div className="w-full max-w-2xl text-center">
        <div className="mb-2 text-6xl animate-bounce">🌟</div>
        <h1 className="mb-1 text-4xl font-extrabold text-purple-600">Fun Learning Adventure!</h1>
        <p className="mb-6 text-lg font-medium text-purple-400">Choose a level, then pick a game to play.</p>

        <div className="mb-6 rounded-3xl bg-white/80 p-4 shadow-lg backdrop-blur-sm">
          <p className="mb-3 text-sm font-bold uppercase tracking-wide text-purple-400">Difficulty</p>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((level) => (
              <button
                key={level}
                onClick={() => onDifficultyChange(level)}
                className={`rounded-2xl border-2 px-3 py-3 text-center transition-all ${difficulty === level ? "border-purple-500 bg-purple-100 text-purple-700 scale-[1.02]" : "border-white bg-white text-gray-500 hover:border-purple-200"}`}
              >
                <div className="text-lg font-extrabold">{difficultyLabels[level]}</div>
                <div className="text-xs font-medium opacity-75">{difficultyDescriptions[level]}</div>
              </button>
            ))}
          </div>
        </div>

        {gamesPlayed > 0 && (
          <div className="mx-auto mb-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-full bg-white px-5 py-2 shadow-md">
            <span className="text-2xl">⭐</span>
            <span className="text-xl font-bold text-amber-500">{totalScore} stars</span>
            <span className="text-gray-300">|</span>
            <span className="text-lg font-bold text-purple-400">{gamesPlayed} levels saved</span>
          </div>
        )}

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {games.map((game) => {
            const best = progress[game.key][difficulty];
            const stars = getStarRating(best, 8);
            return (
              <button
                key={game.key}
                onClick={() => onSelect(game.key)}
                className={`w-full flex items-center gap-4 rounded-3xl ${game.bg} p-5 shadow-lg transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer border-2 border-white/60`}
              >
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${game.gradient} text-3xl shadow-md`}>
                  {game.emoji}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <h2 className="text-xl font-extrabold text-gray-700">{game.title}</h2>
                  <p className="text-sm font-medium text-gray-400">{game.subtitle}</p>
                  <p className="mt-1 text-xs font-bold text-purple-400">Best on {difficultyLabels[difficulty]}: {best}/8</p>
                </div>
                <div className="text-right">
                  <div className="text-lg">{"⭐".repeat(stars)}{stars === 0 ? "☆" : ""}</div>
                  <div className="text-2xl text-gray-300">▶</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl bg-white/85 p-5 text-left shadow-lg backdrop-blur-sm">
          <h2 className="mb-3 text-lg font-extrabold text-purple-600">Badges Earned</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`rounded-2xl border px-4 py-3 ${achievement.unlocked ? "border-yellow-300 bg-yellow-50 text-amber-700" : "border-gray-200 bg-gray-50 text-gray-400"}`}
              >
                <div className="text-2xl">{achievement.unlocked ? achievement.emoji : "🔒"}</div>
                <div className="font-extrabold">{achievement.label}</div>
                <div className="text-xs font-medium">{achievement.unlocked ? "Unlocked!" : "Keep playing to earn this"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoneScreen({ onMenu, totalScore, lastGameScore, lastGameTotal, difficulty }: { onMenu: () => void; totalScore: number; lastGameScore: number; lastGameTotal: number; difficulty: Difficulty }) {
  const stars = getStarRating(lastGameScore, lastGameTotal || 1);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-7xl animate-bounce">🎉</div>
        <h1 className="mb-2 text-4xl font-extrabold text-purple-600">Awesome Job!</h1>
        <p className="mb-3 text-xl text-gray-500">{difficultyLabels[difficulty]} level complete</p>
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-yellow-50 to-amber-50 p-5">
          <div className="mb-2 text-4xl">{"⭐".repeat(Math.max(stars, 1))}</div>
          <p className="text-2xl font-bold text-amber-600">{lastGameScore} / {lastGameTotal} this round</p>
          <p className="mt-2 text-sm font-semibold text-amber-500">{getEncouragement(lastGameScore, lastGameTotal)}</p>
        </div>
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-5">
          <div className="mb-1 text-4xl">{"⭐".repeat(Math.min(totalScore, 20))}</div>
          <p className="text-2xl font-bold text-purple-600">{totalScore} Total Stars!</p>
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

function GameWrapper({
  title,
  emoji,
  current,
  total,
  score,
  onBack,
  bgGradient,
  difficulty,
  children,
}: {
  title: string;
  emoji: string;
  current: number;
  total: number;
  score: number;
  onBack: () => void;
  bgGradient: string;
  difficulty: Difficulty;
  children: React.ReactNode;
}) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className={`flex min-h-screen flex-col items-center ${bgGradient} px-4 py-6`}>
      <div className="mb-4 w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-xl shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
          >
            ←
          </button>
          <h1 className="text-center text-xl font-extrabold text-purple-600 sm:text-2xl">{emoji} {title}</h1>
          <div className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-md">
            <span className="text-lg">⭐</span>
            <span className="text-lg font-bold text-amber-500">{score}</span>
          </div>
        </div>
        <div className="mb-2 text-center text-sm font-bold uppercase tracking-wide text-purple-400">{difficultyLabels[difficulty]} Mode</div>
        <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-center text-sm font-semibold text-purple-400">{current + 1} / {total}</p>
      </div>
      <div className="flex w-full max-w-md flex-1 items-start justify-center">{children}</div>
    </div>
  );
}

function buildFindItQuestions(difficulty: Difficulty): FindItQuestion[] {
  const base = shuffle(findItQuestions).map((q) => ({ ...q, options: shuffle(q.options) }));
  if (difficulty === "easy") return base.slice(0, 8);
  if (difficulty === "medium") return base.slice(0, 10);
  return base.map((q) => ({ ...q, word: `Find something that starts with ${q.word[0]}... ${q.word}` })).slice(0, 10);
}

function FindItGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = difficulty === "easy" ? 8 : 10;
  const [questions] = useState<FindItQuestion[]>(() => buildFindItQuestions(difficulty).slice(0, TOTAL));
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
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1400);
  }

  return (
    <GameWrapper title="Find It!" emoji="🔍" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-3 text-center">
          <p className="mb-1 text-xl font-bold text-gray-400">Find the...</p>
          <h2 className="text-4xl font-extrabold text-orange-500 sm:text-5xl">{question.word}</h2>
        </div>
        <p className="mb-3 text-center text-base font-bold text-gray-500">Tap the picture that matches. 👇</p>
        <div className="flex justify-center gap-4 sm:gap-6">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-amber-50 to-orange-50 border-orange-200 hover:from-amber-100 hover:to-orange-100 hover:scale-110";
            if (selected) {
              if (option === question.correctEmoji) btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 scale-110 ring-4 ring-green-300";
              else if (option === selected && !isCorrect) btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 animate-[shake_0.4s_ease-in-out] opacity-60";
              else btnStyle = "bg-gray-50 border-gray-200 opacity-40";
            }
            return (
              <button key={option} onClick={() => handleSelect(option)} disabled={!!selected} className={`flex h-24 w-24 items-center justify-center rounded-3xl border-4 text-5xl transition-all duration-200 cursor-pointer sm:h-28 sm:w-28 sm:text-6xl ${btnStyle}`}>
                {option}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className="mt-5 text-center">
            <p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-orange-400"}`}>{isCorrect ? "🎉 Great job!" : `Try again next time, it was ${question.correctEmoji}`}</p>
            <p className="mt-1 text-sm font-semibold text-gray-400">{difficulty === "hard" ? `Hint: ${question.word[question.word.length - 1] ? `listen for the first sound in ${question.word.replace("Find something that starts with ", "")}` : ""}` : "Picture words help us read!"}</p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}

function buildCountingQuestions(difficulty: Difficulty) {
  const questions = generateCountingQuestions();
  return questions.map((q, index) => {
    if (difficulty === "easy") {
      const count = Math.min(q.count, 5);
      return { ...q, count, options: shuffle([count, Math.max(1, count - 1), Math.min(10, count + 1)]) };
    }
    if (difficulty === "medium") {
      return q;
    }
    if (index % 2 === 0) {
      const count = Math.min(q.count + 2, 10);
      return { ...q, count, options: shuffle([count, Math.max(1, count - 2), Math.min(10, count + 1)]) };
    }
    const answer = 10 - q.count;
    return {
      ...q,
      count: q.count,
      target: 10,
      questionType: "make10" as const,
      options: shuffle([answer, Math.max(1, answer - 1), Math.min(10, answer + 2)]),
    };
  });
}

function CountingGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<any[]>(() => buildCountingQuestions(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];
  const expectedAnswer = question.questionType === "make10" ? 10 - question.count : question.count;
  const emojiDisplay = Array.from({ length: question.count }, (_, i) => (
    <span key={i} className="mx-1 inline-block text-4xl sm:text-5xl" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "both" }}>{question.emoji}</span>
  ));

  function handleSelect(option: number) {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === expectedAnswer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Counting Fun" emoji="🔢" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex min-h-[120px] flex-wrap items-center justify-center gap-2 rounded-2xl bg-blue-50 p-6">{emojiDisplay}</div>
        <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">
          {question.questionType === "make10" ? `How many more ${question.emoji} to make 10?` : `How many ${question.emoji} do you see?`}
        </h2>
        <p className="mb-6 text-center text-sm font-semibold text-blue-400">{question.questionType === "make10" ? "Count on to 10." : difficulty === "hard" ? "Count carefully, some are trickier now." : "Count each one."}</p>
        <div className="flex justify-center gap-4">
          {question.options.map((option: number) => {
            let btnStyle = "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-300 text-blue-700 hover:from-blue-200 hover:to-cyan-200";
            if (selected !== null) {
              if (option === expectedAnswer) btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 text-green-700 scale-110";
              else if (option === selected && !isCorrect) btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-100 border-gray-200 text-gray-400";
            }
            return <button key={option} onClick={() => handleSelect(option)} disabled={selected !== null} className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-4xl font-extrabold transition-all duration-200 cursor-pointer sm:h-24 sm:w-24 sm:text-5xl ${btnStyle}`}>{option}</button>;
          })}
        </div>
        {selected !== null && <div className="mt-5 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-blue-400"}`}>{isCorrect ? "🎉 Correct!" : question.questionType === "make10" ? `${question.count} and ${expectedAnswer} make 10.` : `There are ${expectedAnswer}!`}</p></div>}
      </div>
    </GameWrapper>
  );
}

function ColorGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<ColorQuestion[]>(() => shuffle(colorQuestions).slice(0, TOTAL).map((q) => ({ ...q, options: shuffle(q.options) })));
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
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Color Quiz" emoji="🎨" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex justify-center">
          <div className="text-[130px] leading-none sm:text-[160px]" style={{ color: question.colorHex, textShadow: question.colorName === "White" ? "0 0 10px rgba(0,0,0,0.1)" : "none" }}>{question.shape}</div>
        </div>
        <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">{difficulty === "hard" ? "Which color name matches this shape?" : "What color is this?"}</h2>
        <p className="mb-6 text-center text-sm font-semibold text-purple-400">{difficulty === "hard" ? "Use the color word, not the shape clue." : "Look carefully at the color."}</p>
        <div className="space-y-3">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-300 text-purple-700 hover:from-purple-100 hover:to-fuchsia-100";
            if (selected) {
              if (option === question.colorName) btnStyle = "bg-green-100 border-green-400 text-green-700 scale-105";
              else if (option === selected && !isCorrect) btnStyle = "bg-red-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-50 border-gray-200 text-gray-400";
            }
            return <button key={option} onClick={() => handleSelect(option)} disabled={!!selected} className={`w-full rounded-2xl border-2 p-4 text-2xl font-extrabold transition-all duration-200 cursor-pointer sm:text-3xl ${btnStyle}`}>{option}</button>;
          })}
        </div>
        {selected && <div className="mt-4 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-purple-400"}`}>{isCorrect ? "🎉 Correct!" : `It’s ${question.colorName}!`}</p><p className="mt-1 text-sm font-semibold text-purple-300">{difficulty === "hard" ? `${question.colorName} is the color word.` : "You matched the color correctly."}</p></div>}
      </div>
    </GameWrapper>
  );
}

function ShapeSVG({ name, size = 160 }: { name: string; size?: number }) {
  const colors: Record<string, { fill: string; stroke: string }> = {
    Circle: { fill: "#3B82F6", stroke: "#2563EB" }, Square: { fill: "#EF4444", stroke: "#DC2626" }, Triangle: { fill: "#22C55E", stroke: "#16A34A" }, Star: { fill: "#EAB308", stroke: "#CA8A04" }, Heart: { fill: "#EC4899", stroke: "#DB2777" }, Diamond: { fill: "#A855F7", stroke: "#9333EA" }, Oval: { fill: "#F97316", stroke: "#EA580C" }, Rectangle: { fill: "#06B6D4", stroke: "#0891B2" }, Crescent: { fill: "#FBBF24", stroke: "#D97706" }, Cross: { fill: "#EF4444", stroke: "#DC2626" }, Arrow: { fill: "#10B981", stroke: "#059669" }, Hexagon: { fill: "#8B5CF6", stroke: "#7C3AED" },
  };
  const c = colors[name] || { fill: "#6B7280", stroke: "#4B5563" };
  const s = size;
  const half = s / 2;
  const shapes: Record<string, React.ReactNode> = {
    Circle: <circle cx={half} cy={half} r={half * 0.8} fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Square: <rect x={s * 0.12} y={s * 0.12} width={s * 0.76} height={s * 0.76} rx="8" fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Triangle: <polygon points={`${half},${s * 0.08} ${s * 0.9},${s * 0.88} ${s * 0.1},${s * 0.88}`} fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Star: <polygon points={(() => { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 === 0 ? half * 0.85 : half * 0.35; const angle = (Math.PI / 5) * i - Math.PI / 2; pts.push(`${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`); } return pts.join(" "); })()} fill={c.fill} stroke={c.stroke} strokeWidth="3" />,
    Heart: <path d={`M${half},${s * 0.85} C${s * 0.1},${s * 0.55} ${s * 0.0},${s * 0.2} ${half},${s * 0.35} C${s},${s * 0.2} ${s * 0.9},${s * 0.55} ${half},${s * 0.85}Z`} fill={c.fill} stroke={c.stroke} strokeWidth="3" />,
    Diamond: <polygon points={`${half},${s * 0.05} ${s * 0.9},${half} ${half},${s * 0.95} ${s * 0.1},${half}`} fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Oval: <ellipse cx={half} cy={half} rx={half * 0.85} ry={half * 0.55} fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Rectangle: <rect x={s * 0.08} y={s * 0.22} width={s * 0.84} height={s * 0.56} rx="8" fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
    Crescent: <path d={`M${half * 1.1},${s * 0.08} A${half * 0.8},${half * 0.8} 0 1,1 ${half * 1.1},${s * 0.92} A${half * 0.6},${half * 0.7} 0 1,0 ${half * 1.1},${s * 0.08}Z`} fill={c.fill} stroke={c.stroke} strokeWidth="3" />,
    Cross: <path d={`M${s * 0.35},${s * 0.1} h${s * 0.3} v${s * 0.25} h${s * 0.25} v${s * 0.3} h-${s * 0.25} v${s * 0.25} h-${s * 0.3} v-${s * 0.25} h-${s * 0.25} v-${s * 0.3} h${s * 0.25}Z`} fill={c.fill} stroke={c.stroke} strokeWidth="3" />,
    Arrow: <polygon points={`${s * 0.9},${half} ${s * 0.4},${s * 0.1} ${s * 0.4},${s * 0.35} ${s * 0.1},${s * 0.35} ${s * 0.1},${s * 0.65} ${s * 0.4},${s * 0.65} ${s * 0.4},${s * 0.9}`} fill={c.fill} stroke={c.stroke} strokeWidth="3" />,
    Hexagon: <polygon points={(() => { const pts = []; for (let i = 0; i < 6; i++) { const angle = (Math.PI / 3) * i - Math.PI / 6; pts.push(`${half + half * 0.82 * Math.cos(angle)},${half + half * 0.82 * Math.sin(angle)}`); } return pts.join(" "); })()} fill={c.fill} stroke={c.stroke} strokeWidth="4" />,
  };
  return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="drop-shadow-lg">{shapes[name] || <circle cx={half} cy={half} r={half * 0.8} fill="#ccc" />}</svg>;
}

function ShapeGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<ShapeQuestion[]>(() => shuffle(shapeQuestions).slice(0, TOTAL).map((q) => ({ ...q, options: shuffle(q.options) })));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];
  const shapeFacts: Record<string, string> = { Circle: "A circle has no corners.", Square: "A square has 4 equal sides.", Triangle: "A triangle has 3 sides.", Star: "A star has points.", Heart: "A heart has a point at the bottom.", Diamond: "A diamond looks like a tilted square.", Oval: "An oval is stretched out like an egg.", Rectangle: "A rectangle has 4 sides, two are long.", Crescent: "A crescent looks like the moon.", Cross: "A cross has lines that intersect.", Arrow: "An arrow points in a direction.", Hexagon: "A hexagon has 6 sides." };

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
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Shape Match" emoji="🔷" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex justify-center"><ShapeSVG name={question.shapeName} size={160} /></div>
        <h2 className="mb-2 text-center text-2xl font-extrabold text-gray-700 sm:text-3xl">What shape is this?</h2>
        <p className="mb-6 text-center text-sm font-semibold text-teal-400">{difficulty === "hard" ? shapeFacts[question.shapeName] : "Look at the shape carefully."}</p>
        <div className="space-y-3">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-300 text-teal-700 hover:from-teal-100 hover:to-emerald-100";
            if (selected) {
              if (option === question.shapeName) btnStyle = "bg-green-100 border-green-400 text-green-700 scale-105";
              else if (option === selected && !isCorrect) btnStyle = "bg-red-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-50 border-gray-200 text-gray-400";
            }
            return <button key={option} onClick={() => handleSelect(option)} disabled={!!selected} className={`w-full rounded-2xl border-2 p-4 text-2xl font-extrabold transition-all duration-200 cursor-pointer sm:text-3xl ${btnStyle}`}>{option}</button>;
          })}
        </div>
        {selected && <div className="mt-4 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-teal-400"}`}>{isCorrect ? "🎉 Correct!" : `It’s a ${question.shapeName}!`}</p><p className="mt-1 text-sm font-semibold text-teal-300">{shapeFacts[question.shapeName]}</p></div>}
      </div>
    </GameWrapper>
  );
}

function buildMathQuestions(difficulty: Difficulty) {
  const all = generateMathQuestions();
  if (difficulty === "easy") {
    return all.map((q) => ({ ...q, num1: Math.min(q.num1, 5), num2: Math.min(q.num2, 4), answer: q.operator === "+" ? Math.min(q.num1, 5) + Math.min(q.num2, 4) : Math.max(Math.min(q.num1, 5) - Math.min(q.num2, 4), 0), options: shuffle([q.answer, Math.max(0, q.answer - 1), q.answer + 1]) }));
  }
  if (difficulty === "hard") {
    return all.map((q, i) => i % 3 === 0 ? { ...q, questionType: "missing" as const, answer: q.num2, display: `${q.num1} ${q.operator} ? = ${q.operator === "+" ? q.num1 + q.num2 : q.num1 - q.num2}` } : q);
  }
  return all;
}

function MathGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<any[]>(() => buildMathQuestions(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];
  const answer = question.questionType === "missing" ? question.answer : question.answer;

  function handleSelect(option: number) {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  const options = question.questionType === "missing" ? shuffle([answer, Math.max(0, answer - 1), answer + 2]) : question.options;
  const display = question.questionType === "missing" ? question.display : `${question.num1} ${question.operator} ${question.num2} = ?`;

  return (
    <GameWrapper title="Math Fun" emoji="➕" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-rose-50 via-red-50 to-orange-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-center text-sm font-semibold text-rose-400">{difficulty === "hard" ? "Some questions have a missing number." : "Use the pictures and numbers together."}</div>
        <h2 className="mb-6 text-center text-4xl font-extrabold text-gray-700 sm:text-5xl">{display}</h2>
        <div className="flex justify-center gap-4">
          {options.map((option: number) => {
            let btnStyle = "bg-gradient-to-br from-rose-100 to-red-100 border-rose-300 text-rose-700 hover:from-rose-200 hover:to-red-200";
            if (selected !== null) {
              if (option === answer) btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 text-green-700 scale-110";
              else if (option === selected && !isCorrect) btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-100 border-gray-200 text-gray-400";
            }
            return <button key={option} onClick={() => handleSelect(option)} disabled={selected !== null} className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-4xl font-extrabold transition-all duration-200 cursor-pointer sm:h-24 sm:w-24 sm:text-5xl ${btnStyle}`}>{option}</button>;
          })}
        </div>
        {selected !== null && <div className="mt-5 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-rose-400"}`}>{isCorrect ? "🎉 Correct!" : question.questionType === "missing" ? `The missing number is ${answer}.` : `${question.num1} ${question.operator} ${question.num2} = ${answer}`}</p></div>}
      </div>
    </GameWrapper>
  );
}

function buildPatternQuestions(difficulty: Difficulty) {
  const all = generatePatternQuestions();
  if (difficulty === "easy") return all.filter((q) => q.pattern.length <= 4);
  if (difficulty === "medium") return all;
  return all.concat([
    { pattern: ["🔴", "🔴", "🔵", "🔴", "🔴"], answer: "🔵", options: ["🔵", "🟢", "🟡"] },
    { pattern: ["⭐", "🌙", "☀️", "⭐", "🌙"], answer: "☀️", options: ["☀️", "⭐", "🌙"] },
    { pattern: ["🟩", "🟨", "🟩", "🟨", "🟩"], answer: "🟨", options: ["🟨", "🟩", "🟥"] },
  ]);
}

function PatternGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<PatternQuestion[]>(() => buildPatternQuestions(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === question.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Pattern Fun" emoji="🧩" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-3 text-center"><p className="mb-1 text-xl font-bold text-gray-400">What comes next?</p><p className="text-sm font-semibold text-indigo-300">{difficulty === "hard" ? "Look for the repeating rule." : "Look for the pattern."}</p></div>
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
          {question.pattern.map((item, idx) => <span key={idx} className="text-4xl sm:text-5xl">{item}</span>)}
          <span className="animate-pulse text-4xl font-bold text-indigo-400 sm:text-5xl">❓</span>
        </div>
        <div className="flex justify-center gap-4 sm:gap-6">
          {question.options.map((option) => {
            let btnStyle = "bg-gradient-to-br from-indigo-100 to-violet-100 border-indigo-300 hover:from-indigo-200 hover:to-violet-200";
            if (selected !== null) {
              if (option === question.answer) btnStyle = "bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 scale-110";
              else if (option === selected && !isCorrect) btnStyle = "bg-gradient-to-br from-red-100 to-pink-100 border-red-300 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-100 border-gray-200 opacity-50";
            }
            return <button key={option} onClick={() => handleSelect(option)} disabled={selected !== null} className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-4xl transition-all duration-200 cursor-pointer sm:h-24 sm:w-24 sm:text-5xl ${btnStyle}`}>{option}</button>;
          })}
        </div>
        {selected !== null && <div className="mt-5 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-indigo-400"}`}>{isCorrect ? "🎉 Correct!" : `It was ${question.answer}`}</p></div>}
      </div>
    </GameWrapper>
  );
}

function buildCompareQuestions(difficulty: Difficulty) {
  const all = generateCompareQuestions();
  if (difficulty === "easy") return all.filter((q) => q.valueA < 20 && q.valueB < 20);
  if (difficulty === "medium") return all;
  return all.concat([
    { labelA: "18 + 3", valueA: 21, labelB: "20", valueB: 20, answer: ">", type: "expression" },
    { labelA: "27", valueA: 27, labelB: "14 + 13", valueB: 27, answer: "=", type: "expression" },
    { labelA: "32", valueA: 32, labelB: "19 + 9", valueB: 28, answer: ">", type: "expression" },
  ]);
}

function CompareGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<CompareQuestion[]>(() => buildCompareQuestions(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];
  const symbolIcons: Record<string, string> = { ">": "›", "<": "‹", "=": "=" };
  const symbolLabels: Record<string, string> = { ">": "Greater Than", "<": "Less Than", "=": "Equal" };

  function handleSelect(choice: string) {
    if (selected) return;
    setSelected(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1800);
  }

  const choices: Array<">" | "<" | "="> = [">", "<", "="];
  function getButtonStyle(choice: string) {
    const base = "w-full rounded-2xl border-4 px-3 py-4 sm:px-5 sm:py-5 font-extrabold transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1";
    if (selected === null) return `${base} bg-gradient-to-br from-amber-100 to-yellow-100 border-amber-300 text-amber-700 hover:from-amber-200 hover:to-yellow-200 hover:scale-[1.03] active:scale-[0.97]`;
    if (choice === question.answer) return `${base} bg-gradient-to-br from-green-100 to-emerald-200 border-green-400 text-green-700 scale-[1.05]`;
    if (choice === selected && !isCorrect) return `${base} bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]`;
    return `${base} bg-gray-100 border-gray-200 text-gray-400 opacity-50`;
  }

  return (
    <GameWrapper title="Compare Numbers" emoji="📏" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-4 text-center"><p className="mb-2 text-lg font-bold text-gray-400">Which symbol goes in between?</p><p className="text-sm font-semibold text-amber-300">{difficulty === "hard" ? "Some are equations, solve before you compare." : "Compare the two amounts."}</p></div>
        <div className="mb-6 flex items-center justify-center gap-3 sm:gap-5">
          <div className="rounded-2xl border-4 border-indigo-300 bg-gradient-to-br from-indigo-100 to-blue-100 px-5 py-4 sm:px-8 sm:py-5"><span className="text-3xl font-extrabold text-indigo-600 sm:text-5xl">{question.labelA}</span></div>
          <div className="flex items-center"><span className="text-5xl font-extrabold text-amber-400 sm:text-6xl">?</span></div>
          <div className="rounded-2xl border-4 border-purple-300 bg-gradient-to-br from-purple-100 to-fuchsia-100 px-5 py-4 sm:px-8 sm:py-5"><span className="text-3xl font-extrabold text-purple-600 sm:text-5xl">{question.labelB}</span></div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
          {choices.map((c) => <button key={c} onClick={() => handleSelect(c)} disabled={selected !== null} className={getButtonStyle(c)}><span className="text-3xl leading-none sm:text-5xl">{symbolIcons[c]}</span><span className="text-xs leading-tight sm:text-base">{symbolLabels[c]}</span></button>)}
        </div>
        {selected !== null && <div className="mt-4 text-center"><p className={`text-xl font-extrabold sm:text-2xl ${isCorrect ? "text-green-500" : "text-amber-500"}`}>{isCorrect ? "🎉 Correct!" : `${question.labelA} = ${question.valueA}, ${question.labelB} = ${question.valueB} → ${question.answer}`}</p></div>}
      </div>
    </GameWrapper>
  );
}

function buildPhonicsQuestions(difficulty: Difficulty) {
  if (difficulty === "easy") return phonicsQuestions.filter((q) => q.prompt.includes("starts with")).slice(0, 8);
  if (difficulty === "medium") return shuffle(phonicsQuestions).slice(0, 8);
  return shuffle(phonicsQuestions).slice(0, 10);
}

function PhonicsGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = difficulty === "hard" ? 10 : 8;
  const [questions] = useState<PhonicsQuestion[]>(() => buildPhonicsQuestions(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];

  function handleSelect(option: string) {
    if (selected) return;
    setSelected(option);
    const correct = option === question.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Phonics Fun" emoji="📚" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-lime-50 via-green-50 to-emerald-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-3 text-center"><p className="mb-1 text-xl font-bold text-gray-400">Sound it out!</p><h2 className="text-3xl font-extrabold text-green-600 sm:text-4xl">{question.prompt}</h2></div>
        <p className="mb-6 text-center text-sm font-semibold text-green-400">Listen for the first sound or ending rhyme.</p>
        <div className="space-y-3">
          {question.choices.map((choice) => {
            let btnStyle = "bg-gradient-to-br from-lime-50 to-green-50 border-lime-300 text-green-700 hover:from-lime-100 hover:to-green-100";
            if (selected) {
              if (choice.label === question.answer) btnStyle = "bg-green-100 border-green-400 text-green-700 scale-[1.02]";
              else if (choice.label === selected && !isCorrect) btnStyle = "bg-red-100 border-red-300 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else btnStyle = "bg-gray-50 border-gray-200 text-gray-400";
            }
            return <button key={choice.label} onClick={() => handleSelect(choice.label)} disabled={!!selected} className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer ${btnStyle}`}><span className="text-4xl">{choice.emoji}</span><span className="text-2xl font-extrabold">{choice.label}</span></button>;
          })}
        </div>
        {selected && <div className="mt-4 text-center"><p className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-lime-500"}`}>{isCorrect ? "🎉 Nice reading!" : `The answer is ${question.answer}.`}</p><p className="mt-1 text-sm font-semibold text-green-300">{question.hint}</p></div>}
      </div>
    </GameWrapper>
  );
}

// ============ BUBBLE POP LETTERS ============

type BubbleData = {
  id: string;
  letter: string;
  x: number;
  y: number;
  size: number;
  color: string;
  animDelay: number;
  animDuration: number;
  isCorrect: boolean;
};

type BubbleRound = {
  targetLetter: string;
  bubbles: BubbleData[];
};

const BUBBLE_COLORS = [
  "linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)",
  "linear-gradient(135deg, #4ECDC4 0%, #6EE7DE 50%, #A8F0EA 100%)",
  "linear-gradient(135deg, #45B7D1 0%, #6BC5D8 50%, #96D9E8 100%)",
  "linear-gradient(135deg, #96CEB4 0%, #AEDBC5 50%, #C8E8D6 100%)",
  "linear-gradient(135deg, #FFEAA7 0%, #FFF0BE 50%, #FFF5D4 100%)",
  "linear-gradient(135deg, #DDA0DD 0%, #E6B8E6 50%, #F0D0F0 100%)",
  "linear-gradient(135deg, #FF9A76 0%, #FFB396 50%, #FFCBB5 100%)",
  "linear-gradient(135deg, #74B9FF 0%, #93CAFF 50%, #B2DBFF 100%)",
  "linear-gradient(135deg, #A29BFE 0%, #B8B3FE 50%, #CECAFE 100%)",
  "linear-gradient(135deg, #FD79A8 0%, #FE97BB 50%, #FFB5CE 100%)",
  "linear-gradient(135deg, #55EFC4 0%, #7AF3D5 50%, #9FF7E6 100%)",
  "linear-gradient(135deg, #FDCB6E 0%, #FEDA8E 50%, #FEE8AE 100%)",
];

function generateBubbleRounds(difficulty: Difficulty): BubbleRound[] {
  const rounds: BubbleRound[] = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const totalRounds = 8;

  // Similar-looking letter groups for hard mode
  const trickyGroups: string[][] = [
    ["B", "D", "P", "R"],
    ["M", "N", "W"],
    ["C", "G", "O", "Q"],
    ["I", "L", "T"],
    ["E", "F"],
    ["U", "V"],
    ["S", "Z"],
    ["K", "X"],
  ];

  const bubbleCount = difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 6;
  const usedLetters = new Set<string>();

  for (let r = 0; r < totalRounds; r++) {
    // Pick target letter (avoid repeats)
    let target: string;
    do {
      target = alphabet[Math.floor(Math.random() * alphabet.length)];
    } while (usedLetters.has(target) && usedLetters.size < 20);
    usedLetters.add(target);

    // Generate distractors
    const distractors: string[] = [];
    if (difficulty === "hard") {
      // Use similar-looking letters as distractors
      const group = trickyGroups.find((g) => g.includes(target));
      if (group) {
        const similar = group.filter((l) => l !== target);
        distractors.push(...shuffle(similar).slice(0, bubbleCount - 1));
      }
      // Fill remaining with random
      while (distractors.length < bubbleCount - 1) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (randomLetter !== target && !distractors.includes(randomLetter)) {
          distractors.push(randomLetter);
        }
      }
    } else {
      while (distractors.length < bubbleCount - 1) {
        const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
        if (randomLetter !== target && !distractors.includes(randomLetter)) {
          distractors.push(randomLetter);
        }
      }
    }

    // For medium, randomly show some letters as lowercase
    const allLetters = shuffle([target, ...distractors]).map((letter) => {
      if (difficulty === "medium" && Math.random() > 0.5) {
        return letter.toLowerCase();
      }
      if (difficulty === "hard" && Math.random() > 0.6) {
        return letter.toLowerCase();
      }
      return letter;
    });

    // Target display: for medium/hard, show both cases
    const displayTarget =
      difficulty === "easy" ? target : `${target}`;

    // Generate bubble positions (avoid overlapping)
    const bubbles: BubbleData[] = [];
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < allLetters.length; i++) {
      const letter = allLetters[i];
      const size = difficulty === "easy" ? 90 : difficulty === "medium" ? 80 : 72;

      // Find non-overlapping position
      let x: number, y: number;
      let attempts = 0;
      do {
        x = 10 + Math.random() * (100 - size / 4 - 20);
        y = 5 + Math.random() * (100 - size / 4 - 15);
        attempts++;
      } while (
        attempts < 50 &&
        positions.some(
          (p) => Math.abs(p.x - x) < (size / 4 + 4) && Math.abs(p.y - y) < (size / 4 + 4)
        )
      );
      positions.push({ x, y });

      bubbles.push({
        id: `${r}-${i}`,
        letter,
        x,
        y,
        size,
        color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
        animDelay: Math.random() * 1.5,
        animDuration: 2.5 + Math.random() * 2,
        isCorrect: letter.toUpperCase() === target.toUpperCase(),
      });
    }

    rounds.push({ targetLetter: displayTarget, bubbles });
  }

  return rounds;
}

function BubblePopGame({
  onComplete,
  onBack,
  difficulty,
}: {
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  difficulty: Difficulty;
}) {
  const TOTAL = 8;
  const [rounds] = useState<BubbleRound[]>(() => generateBubbleRounds(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [poppedId, setPoppedId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  const round = rounds[current];

  function handleBubblePop(bubble: BubbleData) {
    if (poppedId || wrongId) return;

    if (bubble.isCorrect) {
      setPoppedId(bubble.id);
      setIsCorrect(true);
      setScore((s) => s + 1);
      fireConfetti();
      setShowResult(true);
      setTimeout(() => {
        if (current + 1 >= TOTAL) {
          onComplete(score + 1, TOTAL);
        } else {
          setCurrent((c) => c + 1);
          setPoppedId(null);
          setWrongId(null);
          setIsCorrect(null);
          setShowResult(false);
        }
      }, 1600);
    } else {
      setWrongId(bubble.id);
      setIsCorrect(false);
      setShowResult(true);
      setTimeout(() => {
        setWrongId(null);
      }, 600);
      setTimeout(() => {
        // Show the correct one highlighted, then move on
        setPoppedId(round.bubbles.find((b) => b.isCorrect)?.id || null);
        setTimeout(() => {
          if (current + 1 >= TOTAL) {
            onComplete(score, TOTAL);
          } else {
            setCurrent((c) => c + 1);
            setPoppedId(null);
            setWrongId(null);
            setIsCorrect(null);
            setShowResult(false);
          }
        }, 1400);
      }, 800);
    }
  }

  return (
    <GameWrapper
      title="Bubble Pop"
      emoji="🫧"
      current={current}
      total={TOTAL}
      score={score}
      onBack={onBack}
      bgGradient="bg-gradient-to-br from-sky-100 via-blue-50 to-cyan-100"
      difficulty={difficulty}
    >
      <div className="w-full rounded-3xl bg-white/90 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
        {/* Target letter display */}
        <div className="mb-4 text-center">
          <p className="mb-1 text-lg font-bold text-gray-400">Pop the bubble with...</p>
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-sky-300 bg-gradient-to-br from-sky-100 to-blue-200 shadow-lg sm:h-24 sm:w-24"
            style={{ animation: "targetPulse 2s ease-in-out infinite" }}
          >
            <span className="text-5xl font-black text-sky-700 sm:text-6xl">
              {round.targetLetter}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-sky-400">
            {difficulty === "easy"
              ? "Find the matching letter!"
              : difficulty === "medium"
                ? "Uppercase or lowercase — find it!"
                : "Watch out for tricky look-alikes!"}
          </p>
        </div>

        {/* Bubble field */}
        <div
          className="relative mx-auto overflow-hidden rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-sky-50 via-blue-50 to-cyan-50"
          style={{ height: "320px", maxWidth: "440px" }}
        >
          {/* Decorative background bubbles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`bg-${i}`}
              className="absolute rounded-full bg-sky-100/40"
              style={{
                width: `${20 + i * 8}px`,
                height: `${20 + i * 8}px`,
                left: `${15 + i * 14}%`,
                top: `${10 + (i % 3) * 30}%`,
                animation: `bubbleFloat ${3 + i * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}

          {/* Interactive bubbles */}
          {round.bubbles.map((bubble) => {
            const isPopped = poppedId === bubble.id;
            const isWrong = wrongId === bubble.id;
            const isRevealed = poppedId && bubble.isCorrect && !isPopped && isCorrect === false;

            return (
              <button
                key={bubble.id}
                onClick={() => handleBubblePop(bubble)}
                disabled={!!poppedId}
                className="absolute cursor-pointer"
                style={{
                  left: `${bubble.x}%`,
                  top: `${bubble.y}%`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  transform: "translate(-50%, -50%)",
                  animation: isPopped
                    ? "bubblePop 0.4s ease-out forwards"
                    : isWrong
                      ? "shake 0.4s ease-in-out"
                      : `bubbleSpawn 0.5s ease-out ${bubble.animDelay}s both, bubbleFloat ${bubble.animDuration}s ease-in-out ${bubble.animDelay + 0.5}s infinite`,
                  zIndex: isPopped || isWrong ? 20 : 10,
                  filter: poppedId && !isPopped && !isRevealed ? "brightness(0.7) saturate(0.5)" : undefined,
                }}
              >
                <div
                  className="relative flex h-full w-full items-center justify-center rounded-full shadow-lg transition-shadow hover:shadow-xl"
                  style={{
                    background: bubble.color,
                    border: isRevealed
                      ? "4px solid #22C55E"
                      : isWrong
                        ? "4px solid #EF4444"
                        : "3px solid rgba(255,255,255,0.6)",
                    boxShadow: isRevealed
                      ? "0 0 20px rgba(34,197,94,0.5)"
                      : isWrong
                        ? "0 0 20px rgba(239,68,68,0.5)"
                        : "0 4px 15px rgba(0,0,0,0.1), inset 0 -4px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  {/* Bubble shine/glare effect */}
                  <div
                    className="absolute rounded-full bg-white/50"
                    style={{
                      width: "35%",
                      height: "20%",
                      top: "15%",
                      left: "20%",
                      borderRadius: "50%",
                      animation: `bubbleShine ${bubble.animDuration}s ease-in-out infinite`,
                      animationDelay: `${bubble.animDelay}s`,
                    }}
                  />
                  {/* Letter */}
                  <span
                    className="relative font-black drop-shadow-sm"
                    style={{
                      fontSize: `${bubble.size * 0.45}px`,
                      color: "rgba(0,0,0,0.65)",
                      textShadow: "0 1px 2px rgba(255,255,255,0.6)",
                    }}
                  >
                    {bubble.letter}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {showResult && (
          <div className="mt-4 text-center">
            <p
              className={`text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-sky-400"}`}
            >
              {isCorrect
                ? "🎉 Pop! Great job!"
                : `Oops! Look for ${round.targetLetter}`}
            </p>
            <p className="mt-1 text-sm font-semibold text-sky-300">
              {isCorrect
                ? difficulty === "hard"
                  ? "You spotted it through the tricky letters!"
                  : "You found the right letter!"
                : "Try the next one!"}
            </p>
          </div>
        )}
      </div>
    </GameWrapper>
  );
}
