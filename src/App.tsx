import { useEffect, useMemo, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  colorQuestions,
  shapeQuestions,
  generateCountingQuestions,
  generateMathQuestions,
  generatePatternQuestions,
  generateCompareQuestions,
  shuffle,
  type CountingQuestion,
  type ColorQuestion,
  type ShapeQuestion,
  type MathQuestion,
  type PatternQuestion,
  type CompareQuestion,
} from "./data/gameData";

type Difficulty = "easy" | "medium" | "hard";
type PlayableGameMode =
  | "counting"
  | "colors"
  | "shapes"
  | "math"
  | "pattern"
  | "compare"
  | "phonics"
  | "bubbles"
  | "memory"
  | "train"
  | "words"
  | "shapebuilder"
  | "sort"
  | "race"
  | "oddone"
  | "story";
type GameMode = "menu" | PlayableGameMode | "done";

type ProgressRecord = Record<PlayableGameMode, Record<Difficulty, number>>;
type Achievement = {
  id: string;
  label: string;
  emoji: string;
  unlocked: boolean;
};

type GameProps = {
  difficulty: Difficulty;
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
};

type GameRegistryEntry = {
  key: PlayableGameMode;
  emoji: string;
  title: string;
  subtitle: string;
  gradient: string;
  bg: string;
  total: (difficulty: Difficulty) => number;
  component: (props: GameProps) => React.ReactElement;
  achievement: {
    id: string;
    label: string;
    emoji: string;
  };
};

type PhonicsQuestion = {
  prompt: string;
  choices: { label: string; emoji: string }[];
  answer: string;
  hint: string;
};

const STORAGE_KEY = "toddler-site-progress-v2";
const difficulties: Difficulty[] = ["easy", "medium", "hard"];

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

function isPlayableMode(mode: GameMode): mode is PlayableGameMode {
  return playableModes.includes(mode as PlayableGameMode);
}

function getGameTotal(mode: PlayableGameMode, difficulty: Difficulty) {
  return gameRegistry.find((game) => game.key === mode)?.total(difficulty) ?? 8;
}

function getMasteryThreshold(mode: PlayableGameMode, difficulty: Difficulty) {
  return Math.ceil(getGameTotal(mode, difficulty) * 0.75);
}

function getAchievementState(progress: ProgressRecord): Achievement[] {
  const gameBadges = gameRegistry.map((game) => {
    const unlocked = difficulties.some((level) => (progress[game.key]?.[level] ?? 0) >= getMasteryThreshold(game.key, level));
    return { ...game.achievement, unlocked };
  });
  const masteredGames = playableModes.filter((mode) =>
    difficulties.some((level) => (progress[mode]?.[level] ?? 0) >= getMasteryThreshold(mode, level))
  ).length;

  return [
    ...gameBadges,
    { id: "super-learner", label: "Super Learner", emoji: "🌟", unlocked: masteredGames >= 6 },
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

function buildNumericOptions(correct: number, min = 0, max = 20): number[] {
  const options = new Set<number>([correct]);
  for (const delta of [-2, -1, 1, 2, 3, -3]) {
    const candidate = correct + delta;
    if (candidate >= min && candidate <= max) options.add(candidate);
    if (options.size >= 3) break;
  }
  while (options.size < 3) {
    options.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return shuffle(Array.from(options).slice(0, 3));
}

function usePersistentProgress() {
  const [progress, setProgress] = useState<ProgressRecord>(() => {
    if (typeof window === "undefined") return getDefaultProgress();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return getDefaultProgress();
      const saved = JSON.parse(raw) as Partial<ProgressRecord>;
      const defaults = getDefaultProgress();
      playableModes.forEach((mode) => {
        defaults[mode] = { ...defaults[mode], ...(saved[mode] ?? {}) };
      });
      return defaults;
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
      if (!isPlayableMode(mode)) return prev;
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

  if (isPlayableMode(mode)) {
    const entry = gameRegistry.find((game) => game.key === mode);
    if (entry) {
      const GameComponent = entry.component;
      return <GameComponent difficulty={difficulty} onComplete={handleGameComplete} onBack={() => setMode("menu")} />;
    }
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
  onSelect: (m: PlayableGameMode) => void;
  totalScore: number;
  gamesPlayed: number;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  progress: ProgressRecord;
  achievements: Achievement[];
}) {
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
          {gameRegistry.map((game) => {
            const best = progress[game.key][difficulty];
            const total = game.total(difficulty);
            const stars = getStarRating(best, total);
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
                  <p className="mt-1 text-xs font-bold text-purple-400">Best on {difficultyLabels[difficulty]}: {best}/{total}</p>
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

type BuiltCountingQuestion = CountingQuestion & {
  questionType?: "make10";
  target?: number;
};

function buildCountingQuestions(difficulty: Difficulty): BuiltCountingQuestion[] {
  const questions = generateCountingQuestions();
  return questions.map((q, index) => {
    if (difficulty === "easy") {
      const count = Math.min(q.count, 5);
      return { ...q, count, options: buildNumericOptions(count, 1, 10) };
    }
    if (difficulty === "medium") {
      return q;
    }
    if (index % 2 === 0) {
      const count = Math.min(q.count + 2, 10);
      return { ...q, count, options: buildNumericOptions(count, 1, 10) };
    }
    const answer = 10 - q.count;
    return {
      ...q,
      count: q.count,
      target: 10,
      questionType: "make10" as const,
      options: buildNumericOptions(answer, 1, 10),
    };
  });
}

function CountingGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<BuiltCountingQuestion[]>(() => buildCountingQuestions(difficulty).slice(0, TOTAL));
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

type BuiltMathQuestion = MathQuestion & {
  questionType?: "missing";
  display?: string;
};

function buildMathQuestions(difficulty: Difficulty): BuiltMathQuestion[] {
  const all = generateMathQuestions();
  if (difficulty === "easy") {
    return all.map((q) => {
      const num2 = Math.min(q.num2, 4);
      const num1 = q.operator === "+" ? Math.min(q.num1, 5) : Math.max(num2 + 1, Math.min(q.num1, 6));
      const answer = q.operator === "+" ? num1 + num2 : num1 - num2;
      return { ...q, num1, num2, answer, options: buildNumericOptions(answer, 0, 12) };
    });
  }
  if (difficulty === "hard") {
    return all.map((q, i) => i % 3 === 0 ? {
      ...q,
      questionType: "missing" as const,
      answer: q.num2,
      display: `${q.num1} ${q.operator} ? = ${q.operator === "+" ? q.num1 + q.num2 : q.num1 - q.num2}`,
      options: buildNumericOptions(q.num2, 0, 12),
    } : q);
  }
  return all;
}

function MathGame({ onComplete, onBack, difficulty }: { onComplete: (score: number, total: number) => void; onBack: () => void; difficulty: Difficulty }) {
  const TOTAL = 8;
  const [questions] = useState<BuiltMathQuestion[]>(() => buildMathQuestions(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const question = questions[current];
  const answer = question.answer;

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

  const options = question.options;
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
  const easyPatterns: PatternQuestion[] = [
    { pattern: ["🔴", "🔵", "🔴"], answer: "🔵", options: ["🔵", "🔴", "🟢"] },
    { pattern: ["⭐", "🌙", "⭐"], answer: "🌙", options: ["🌙", "⭐", "☀️"] },
    { pattern: ["🍎", "🍌", "🍎"], answer: "🍌", options: ["🍌", "🍎", "🍊"] },
    { pattern: ["🐱", "🐶", "🐱"], answer: "🐶", options: ["🐶", "🐱", "🐰"] },
    { pattern: ["🌸", "🌻", "🌸"], answer: "🌻", options: ["🌻", "🌸", "🌼"] },
    { pattern: ["🟢", "🟡", "🟢"], answer: "🟡", options: ["🟡", "🟢", "🔴"] },
    { pattern: ["🎈", "🎁", "🎈"], answer: "🎁", options: ["🎁", "🎈", "🎀"] },
    { pattern: ["🦋", "🐛", "🦋"], answer: "🐛", options: ["🐛", "🦋", "🐝"] },
  ];
  if (difficulty === "easy") return shuffle(easyPatterns);
  if (difficulty === "medium") return all;
  return shuffle([...all, ...([
    { pattern: ["🔴", "🔴", "🔵", "🔴", "🔴"], answer: "🔵", options: ["🔵", "🟢", "🟡"] },
    { pattern: ["⭐", "🌙", "☀️", "⭐", "🌙"], answer: "☀️", options: ["☀️", "⭐", "🌙"] },
    { pattern: ["🟩", "🟨", "🟩", "🟨", "🟩"], answer: "🟨", options: ["🟨", "🟩", "🟥"] },
  ] satisfies PatternQuestion[])]);
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
  if (difficulty === "easy") {
    const questions: CompareQuestion[] = [];
    for (let i = 0; i < 8; i++) {
      const valueA = Math.floor(Math.random() * 18) + 1;
      let valueB = Math.floor(Math.random() * 18) + 1;
      if (i === 3) valueB = valueA;
      const answer: ">" | "<" | "=" = valueA > valueB ? ">" : valueA < valueB ? "<" : "=";
      questions.push({ labelA: `${valueA}`, valueA, labelB: `${valueB}`, valueB, answer, type: "numbers" });
    }
    return shuffle(questions);
  }
  if (difficulty === "medium") return all;
  return shuffle([...all, ...([
    { labelA: "18 + 3", valueA: 21, labelB: "20", valueB: 20, answer: ">", type: "expression" },
    { labelA: "27", valueA: 27, labelB: "14 + 13", valueB: 27, answer: "=", type: "expression" },
    { labelA: "32", valueA: 32, labelB: "19 + 9", valueB: 28, answer: ">", type: "expression" },
  ] satisfies CompareQuestion[])]);
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
  size: number;
  color: string;
  animDelay: number;
  animDuration: number;
  isCorrect: boolean;
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

function getBubbleTargetCount(difficulty: Difficulty) {
  if (difficulty === "easy") return 6;
  if (difficulty === "medium") return 8;
  return 10;
}

function pickBubbleTarget() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function generateBubbleStream(difficulty: Difficulty, target: string): BubbleData[] {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
  const targetCount = getBubbleTargetCount(difficulty);
  const totalBubbles = difficulty === "easy" ? 18 : difficulty === "medium" ? 24 : 30;
  const lanes = difficulty === "easy" ? [18, 42, 66, 82] : [12, 28, 44, 60, 76, 88];
  const group = trickyGroups.find((candidate) => candidate.includes(target));
  const distractorPool = group && difficulty === "hard"
    ? [...group.filter((letter) => letter !== target), ...alphabet.split("").filter((letter) => letter !== target)]
    : alphabet.split("").filter((letter) => letter !== target);
  const letters = shuffle([
    ...Array.from({ length: targetCount }, () => target),
    ...Array.from({ length: totalBubbles - targetCount }, (_, index) => distractorPool[index % distractorPool.length]),
  ]);

  return letters.map((letter, index) => {
    const canUseLowercase = difficulty !== "easy" && Math.random() > (difficulty === "medium" ? 0.55 : 0.45);
    const shownLetter = canUseLowercase ? letter.toLowerCase() : letter;
    return {
      id: `${letter}-${index}`,
      letter: shownLetter,
      x: lanes[index % lanes.length] + (Math.random() * 6 - 3),
      size: difficulty === "easy" ? 84 : difficulty === "medium" ? 76 : 68,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
      animDelay: index * (difficulty === "easy" ? 1.2 : difficulty === "medium" ? 0.9 : 0.72),
      animDuration: difficulty === "easy" ? 12 : difficulty === "medium" ? 10 : 8.5,
      isCorrect: letter === target,
    };
  });
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
  const TOTAL = getBubbleTargetCount(difficulty);
  const [targetLetter] = useState(() => pickBubbleTarget());
  const [bubbles] = useState<BubbleData[]>(() => generateBubbleStream(difficulty, targetLetter));
  const [score, setScore] = useState(0);
  const [poppedIds, setPoppedIds] = useState<string[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [message, setMessage] = useState("Pop every matching bubble before it floats away.");

  function handleBubblePop(bubble: BubbleData) {
    if (poppedIds.includes(bubble.id) || score >= TOTAL) return;

    if (bubble.isCorrect) {
      const nextScore = score + 1;
      setPoppedIds((ids) => [...ids, bubble.id]);
      setScore(nextScore);
      setMessage(nextScore >= TOTAL ? "All matching bubbles popped!" : "Pop! Find another one.");
      fireConfetti();
      if (nextScore >= TOTAL) setTimeout(() => onComplete(nextScore, TOTAL), 1200);
    } else {
      setWrongId(bubble.id);
      setMessage(`Keep looking for ${targetLetter}.`);
      setTimeout(() => {
        setWrongId(null);
      }, 550);
    }
  }

  return (
    <GameWrapper
      title="Bubble Pop"
      emoji="🫧"
      current={Math.min(score, TOTAL - 1)}
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
              {targetLetter}
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
          style={{ height: "360px", maxWidth: "440px" }}
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
          {bubbles.map((bubble) => {
            const isPopped = poppedIds.includes(bubble.id);
            const isWrong = wrongId === bubble.id;

            return (
              <button
                key={bubble.id}
                onClick={() => handleBubblePop(bubble)}
                disabled={isPopped || score >= TOTAL}
                className="absolute cursor-pointer"
                style={{
                  left: `${bubble.x}%`,
                  bottom: `-${bubble.size + 24}px`,
                  width: `${bubble.size}px`,
                  height: `${bubble.size}px`,
                  animation: `bubbleRise ${bubble.animDuration}s linear ${bubble.animDelay}s infinite`,
                  zIndex: isPopped || isWrong ? 20 : 10,
                }}
              >
                <div
                  className="relative flex h-full w-full items-center justify-center rounded-full shadow-lg transition-shadow hover:shadow-xl"
                  style={{
                    background: bubble.color,
                    border: isWrong
                        ? "4px solid #EF4444"
                        : "3px solid rgba(255,255,255,0.6)",
                    boxShadow: isWrong
                        ? "0 0 20px rgba(239,68,68,0.5)"
                        : "0 4px 15px rgba(0,0,0,0.1), inset 0 -4px 8px rgba(0,0,0,0.05)",
                    animation: isPopped
                      ? "bubblePop 0.4s ease-out forwards"
                      : isWrong
                        ? "shake 0.4s ease-in-out"
                        : `bubbleWobble ${2.4 + (bubble.animDelay % 1.3)}s ease-in-out ${bubble.animDelay}s infinite`,
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
        <div className="mt-4 text-center">
          <p className={`text-2xl font-extrabold ${score >= TOTAL ? "text-green-500" : "text-sky-500"}`}>
            {message}
          </p>
          <p className="mt-1 text-sm font-semibold text-sky-300">
            Reload the page to practice a different letter.
          </p>
        </div>
      </div>
    </GameWrapper>
  );
}

// ============ MEMORY MATCH ============

type MemoryCard = {
  id: string;
  matchId: string;
  emoji: string;
};

const memoryItems = ["🍎", "⭐", "🐟", "🦋", "🌸", "🎈", "🚗", "🐶", "🌙", "🍕", "🎂", "🌈"];

function getMemoryPairCount(difficulty: Difficulty) {
  if (difficulty === "easy") return 4;
  if (difficulty === "medium") return 6;
  return 8;
}

function buildMemoryCards(difficulty: Difficulty): MemoryCard[] {
  const pairs = shuffle(memoryItems).slice(0, getMemoryPairCount(difficulty));
  return shuffle(pairs.flatMap((emoji, pairIndex) => [
    { id: `${pairIndex}-a`, matchId: `${pairIndex}`, emoji },
    { id: `${pairIndex}-b`, matchId: `${pairIndex}`, emoji },
  ]));
}

function MemoryMatchGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = getMemoryPairCount(difficulty);
  const [cards] = useState<MemoryCard[]>(() => buildMemoryCards(difficulty));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [locked, setLocked] = useState(false);

  function handleFlip(card: MemoryCard) {
    if (locked || flipped.includes(card.id) || matched.includes(card.id)) return;
    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    setLocked(true);
    const first = cards.find((candidate) => candidate.id === nextFlipped[0]);
    const isMatch = first?.matchId === card.matchId;
    if (isMatch) {
      const nextScore = score + 1;
      setMatched((currentMatched) => [...currentMatched, ...nextFlipped]);
      setScore(nextScore);
      fireConfetti();
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
        if (nextScore >= TOTAL) onComplete(nextScore, TOTAL);
      }, 850);
    } else {
      setTimeout(() => {
        setFlipped([]);
        setLocked(false);
      }, 950);
    }
  }

  return (
    <GameWrapper title="Memory Match" emoji="🧠" current={Math.min(score, TOTAL - 1)} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-fuchsia-50 via-pink-50 to-rose-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-extrabold text-fuchsia-600 sm:text-3xl">Find the matching pairs</h2>
          <p className="mt-1 text-sm font-semibold text-fuchsia-300">{difficulty === "hard" ? "More cards are hiding now." : "Tap two cards and remember what you saw."}</p>
        </div>
        <div className={`grid gap-3 ${difficulty === "easy" ? "grid-cols-4" : "grid-cols-4"}`}>
          {cards.map((card) => {
            const isVisible = flipped.includes(card.id) || matched.includes(card.id);
            const isMatched = matched.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handleFlip(card)}
                className={`flex aspect-square items-center justify-center rounded-2xl border-4 text-4xl font-black shadow-md transition-all duration-200 cursor-pointer sm:text-5xl ${isVisible ? isMatched ? "border-green-300 bg-green-50 scale-[1.03]" : "border-fuchsia-300 bg-fuchsia-50" : "border-fuchsia-200 bg-gradient-to-br from-fuchsia-400 to-pink-500 text-white hover:scale-[1.04]"}`}
              >
                {isVisible ? card.emoji : "?"}
              </button>
            );
          })}
        </div>
      </div>
    </GameWrapper>
  );
}

// ============ NUMBER TRAIN ============

type TrainRound = {
  prompt: string;
  numbers: number[];
  answer: number[];
};

function buildTrainRounds(difficulty: Difficulty): TrainRound[] {
  return Array.from({ length: 8 }, (_, index) => {
    const carCount = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
    const max = difficulty === "easy" ? 12 : difficulty === "medium" ? 30 : 60;
    const numbers = new Set<number>();
    while (numbers.size < carCount) {
      const base = difficulty === "hard" && index % 2 === 0 ? Math.floor(Math.random() * 12) * 5 + 5 : Math.floor(Math.random() * max) + 1;
      numbers.add(base);
    }
    const answer = Array.from(numbers).sort((a, b) => a - b);
    return {
      prompt: difficulty === "hard" ? "Build the train from smallest to biggest." : "Tap the cars in number order.",
      numbers: shuffle(answer),
      answer,
    };
  });
}

function NumberTrainGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<TrainRound[]>(() => buildTrainRounds(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];
  const available = round.numbers.filter((number) => !placed.includes(number));

  function advance(correct: boolean) {
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((value) => value + 1);
        setPlaced([]);
        setIsCorrect(null);
      }
    }, 1400);
  }

  function handlePick(number: number) {
    if (isCorrect !== null) return;
    const nextPlaced = [...placed, number];
    setPlaced(nextPlaced);
    if (nextPlaced.length === round.answer.length) {
      const correct = nextPlaced.every((value, index) => value === round.answer[index]);
      setIsCorrect(correct);
      if (correct) {
        setScore((value) => value + 1);
        fireConfetti();
      }
      advance(correct);
    }
  }

  return (
    <GameWrapper title="Number Train" emoji="🚂" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-extrabold text-blue-600 sm:text-3xl">{round.prompt}</h2>
          <p className="mt-1 text-sm font-semibold text-blue-300">Fill each car from left to right.</p>
        </div>
        <div className="mb-5 flex items-center justify-center gap-2 rounded-2xl bg-blue-50 p-4">
          <span className="text-4xl">🚂</span>
          {round.answer.map((_, index) => (
            <div key={index} className={`flex h-16 w-16 items-center justify-center rounded-xl border-4 text-2xl font-black sm:h-20 sm:w-20 sm:text-3xl ${isCorrect === false ? "border-red-300 bg-red-50 text-red-500" : "border-blue-300 bg-white text-blue-700"}`}>
              {placed[index] ?? ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {available.map((number) => (
            <button key={number} onClick={() => handlePick(number)} className="rounded-2xl border-4 border-cyan-300 bg-cyan-50 p-4 text-3xl font-black text-cyan-700 shadow-md transition-transform hover:scale-[1.04] active:scale-95 cursor-pointer">
              {number}
            </button>
          ))}
        </div>
        {isCorrect !== null && <p className={`mt-5 text-center text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-blue-500"}`}>{isCorrect ? "🎉 Train is ready!" : `Order: ${round.answer.join(", ")}`}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ WORD BUILDER ============

type WordRound = {
  word: string;
  emoji: string;
  hint: string;
  tiles: { id: string; letter: string }[];
};

const wordBank = [
  { word: "CAT", emoji: "🐱", hint: "A pet that says meow." },
  { word: "DOG", emoji: "🐶", hint: "A pet that says woof." },
  { word: "SUN", emoji: "☀️", hint: "It shines in the sky." },
  { word: "HAT", emoji: "🎩", hint: "You wear it on your head." },
  { word: "LOG", emoji: "🪵", hint: "A piece of a tree." },
  { word: "BUG", emoji: "🐞", hint: "A tiny crawling animal." },
  { word: "BUS", emoji: "🚌", hint: "It carries people around town." },
  { word: "BED", emoji: "🛏️", hint: "You sleep in it." },
  { word: "FISH", emoji: "🐟", hint: "It swims in water." },
  { word: "MOON", emoji: "🌙", hint: "You see it at night." },
  { word: "TREE", emoji: "🌲", hint: "It has leaves." },
  { word: "BALL", emoji: "⚽", hint: "You can kick or throw it." },
  { word: "CAKE", emoji: "🎂", hint: "A birthday treat." },
  { word: "STAR", emoji: "⭐", hint: "It twinkles." },
  { word: "BIRD", emoji: "🐦", hint: "It can fly." },
  { word: "RAIN", emoji: "🌧️", hint: "Water from clouds." },
  { word: "BOOK", emoji: "📘", hint: "You read it." },
];

function getWordRoundTotal(difficulty: Difficulty) {
  return difficulty === "hard" ? 10 : 8;
}

function buildWordRounds(difficulty: Difficulty): WordRound[] {
  const maxLength = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;
  return shuffle(wordBank)
    .filter((entry) => entry.word.length <= maxLength)
    .slice(0, getWordRoundTotal(difficulty))
    .map((entry) => ({
      ...entry,
      tiles: shuffle(entry.word.split("").map((letter, index) => ({ id: `${entry.word}-${index}`, letter }))),
    }));
}

function WordBuilderGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = getWordRoundTotal(difficulty);
  const [rounds] = useState<WordRound[]>(() => buildWordRounds(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];
  const selectedLetters = selectedIds.map((id) => round.tiles.find((tile) => tile.id === id)?.letter ?? "");

  function complete(nextIds: string[]) {
    const word = nextIds.map((id) => round.tiles.find((tile) => tile.id === id)?.letter ?? "").join("");
    const correct = word === round.word;
    setIsCorrect(correct);
    if (correct) {
      setScore((value) => value + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((value) => value + 1);
        setSelectedIds([]);
        setIsCorrect(null);
      }
    }, 1500);
  }

  function handleTile(tileId: string) {
    if (isCorrect !== null || selectedIds.includes(tileId)) return;
    const nextIds = [...selectedIds, tileId];
    setSelectedIds(nextIds);
    if (nextIds.length === round.word.length) complete(nextIds);
  }

  return (
    <GameWrapper title="Word Builder" emoji="🔤" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-emerald-50 via-lime-50 to-yellow-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4 text-center">
          <div className="text-7xl">{round.emoji}</div>
          <h2 className="mt-2 text-2xl font-extrabold text-emerald-600 sm:text-3xl">Build the word</h2>
          <p className="mt-1 text-sm font-semibold text-emerald-300">{round.hint}</p>
        </div>
        <div className="mb-5 flex justify-center gap-2">
          {round.word.split("").map((_, index) => (
            <div key={index} className={`flex h-16 w-14 items-center justify-center rounded-xl border-4 text-3xl font-black sm:h-20 sm:w-16 sm:text-4xl ${isCorrect === false ? "border-red-300 bg-red-50 text-red-500" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
              {selectedLetters[index] ?? ""}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {round.tiles.map((tile) => (
            <button key={tile.id} onClick={() => handleTile(tile.id)} disabled={selectedIds.includes(tile.id) || isCorrect !== null} className={`flex h-16 w-16 items-center justify-center rounded-2xl border-4 text-3xl font-black shadow-md transition-transform cursor-pointer sm:h-20 sm:w-20 sm:text-4xl ${selectedIds.includes(tile.id) ? "border-gray-200 bg-gray-100 text-gray-300" : "border-lime-300 bg-lime-50 text-lime-700 hover:scale-[1.04] active:scale-95"}`}>
              {tile.letter}
            </button>
          ))}
        </div>
        {isCorrect !== null && <p className={`mt-5 text-center text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-emerald-500"}`}>{isCorrect ? "🎉 You built it!" : `It spells ${round.word}.`}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ SHAPE BUILDER ============

type ShapeBuildRound = {
  picture: string;
  emoji: string;
  pieces: string[];
  options: string[];
};

const shapePieceIcons: Record<string, string> = {
  Circle: "●",
  Square: "■",
  Triangle: "▲",
  Rectangle: "▬",
  Star: "★",
  Diamond: "◆",
  Oval: "⬮",
  Heart: "♥",
};

const shapeBuildBank: ShapeBuildRound[] = [
  { picture: "House", emoji: "🏠", pieces: ["Square", "Triangle"], options: [] },
  { picture: "Rocket", emoji: "🚀", pieces: ["Rectangle", "Triangle", "Circle"], options: [] },
  { picture: "Flower", emoji: "🌸", pieces: ["Circle", "Oval", "Heart"], options: [] },
  { picture: "Robot", emoji: "🤖", pieces: ["Square", "Rectangle", "Circle"], options: [] },
  { picture: "Fish", emoji: "🐟", pieces: ["Oval", "Triangle", "Circle"], options: [] },
  { picture: "Kite", emoji: "🪁", pieces: ["Diamond", "Triangle"], options: [] },
  { picture: "Castle", emoji: "🏰", pieces: ["Square", "Rectangle", "Triangle"], options: [] },
  { picture: "Badge", emoji: "🏅", pieces: ["Circle", "Star", "Rectangle"], options: [] },
];

function buildShapeBuilderRounds(difficulty: Difficulty): ShapeBuildRound[] {
  const extras = Object.keys(shapePieceIcons);
  return shuffle(shapeBuildBank).map((round) => {
    const extraCount = difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
    const distractors = shuffle(extras.filter((shape) => !round.pieces.includes(shape))).slice(0, extraCount);
    return { ...round, options: shuffle([...round.pieces, ...distractors]) };
  });
}

function ShapeBuilderGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<ShapeBuildRound[]>(() => buildShapeBuilderRounds(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];

  function handleShape(shape: string) {
    if (isCorrect !== null || selected.includes(shape)) return;
    const nextSelected = [...selected, shape];
    setSelected(nextSelected);
    if (nextSelected.length === round.pieces.length) {
      const correct = round.pieces.every((piece) => nextSelected.includes(piece));
      setIsCorrect(correct);
      if (correct) {
        setScore((value) => value + 1);
        fireConfetti();
      }
      setTimeout(() => {
        if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
        else {
          setCurrent((value) => value + 1);
          setSelected([]);
          setIsCorrect(null);
        }
      }, 1500);
    }
  }

  return (
    <GameWrapper title="Shape Builder" emoji="🧱" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4 text-center">
          <div className="text-7xl">{round.emoji}</div>
          <h2 className="mt-2 text-2xl font-extrabold text-teal-600 sm:text-3xl">Build a {round.picture}</h2>
          <p className="mt-1 text-sm font-semibold text-teal-300">Pick the shapes it needs.</p>
        </div>
        <div className="mb-5 flex min-h-[84px] flex-wrap justify-center gap-3 rounded-2xl bg-teal-50 p-4">
          {round.pieces.map((_, index) => (
            <div key={index} className={`flex h-16 w-16 items-center justify-center rounded-xl border-4 text-4xl ${isCorrect === false ? "border-red-300 bg-red-50 text-red-500" : "border-teal-300 bg-white text-teal-700"}`}>
              {selected[index] ? shapePieceIcons[selected[index]] : ""}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {round.options.map((shape) => (
            <button key={shape} onClick={() => handleShape(shape)} disabled={selected.includes(shape) || isCorrect !== null} className={`rounded-2xl border-4 p-3 text-center shadow-md transition-transform cursor-pointer ${selected.includes(shape) ? "border-gray-200 bg-gray-100 text-gray-300" : "border-cyan-300 bg-cyan-50 text-cyan-700 hover:scale-[1.03] active:scale-95"}`}>
              <div className="text-4xl leading-none">{shapePieceIcons[shape]}</div>
              <div className="mt-1 text-sm font-extrabold">{shape}</div>
            </button>
          ))}
        </div>
        {isCorrect !== null && <p className={`mt-5 text-center text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-teal-500"}`}>{isCorrect ? "🎉 Picture built!" : `Use ${round.pieces.join(", ")}.`}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ TREASURE SORT ============

type SortItem = {
  label: string;
  emoji: string;
  color: string;
  group: string;
  first: string;
};

type SortRound = {
  item: SortItem;
  rule: "color" | "group" | "first";
  bins: string[];
  answer: string;
};

const sortItems: SortItem[] = [
  { label: "Apple", emoji: "🍎", color: "Red", group: "Food", first: "A" },
  { label: "Ball", emoji: "⚽", color: "Black", group: "Toy", first: "B" },
  { label: "Car", emoji: "🚗", color: "Red", group: "Toy", first: "C" },
  { label: "Sun", emoji: "☀️", color: "Yellow", group: "Nature", first: "S" },
  { label: "Tree", emoji: "🌲", color: "Green", group: "Nature", first: "T" },
  { label: "Cake", emoji: "🎂", color: "Pink", group: "Food", first: "C" },
  { label: "Book", emoji: "📘", color: "Blue", group: "School", first: "B" },
  { label: "Pencil", emoji: "✏️", color: "Yellow", group: "School", first: "P" },
  { label: "Fish", emoji: "🐟", color: "Blue", group: "Animal", first: "F" },
  { label: "Dog", emoji: "🐶", color: "Brown", group: "Animal", first: "D" },
];

function buildSortRounds(difficulty: Difficulty): SortRound[] {
  return shuffle(sortItems).slice(0, 8).map((item, index) => {
    const rule: SortRound["rule"] = difficulty === "easy" ? "color" : difficulty === "medium" ? "group" : index % 2 === 0 ? "first" : "group";
    const answer = item[rule];
    const allBins = Array.from(new Set(sortItems.map((candidate) => candidate[rule])));
    return { item, rule, answer, bins: shuffle([answer, ...shuffle(allBins.filter((bin) => bin !== answer)).slice(0, difficulty === "easy" ? 1 : 2)]) };
  });
}

function TreasureSortGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<SortRound[]>(() => buildSortRounds(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];
  const ruleLabel = round.rule === "first" ? "first letter" : round.rule;

  function handleBin(bin: string) {
    if (selected) return;
    setSelected(bin);
    const correct = bin === round.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((value) => value + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((value) => value + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1400);
  }

  return (
    <GameWrapper title="Treasure Sort" emoji="🧺" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-5 text-center">
          <div className="text-7xl">{round.item.emoji}</div>
          <h2 className="mt-2 text-2xl font-extrabold text-orange-600 sm:text-3xl">Sort the {round.item.label}</h2>
          <p className="mt-1 text-sm font-semibold text-orange-300">Choose the matching {ruleLabel} bin.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {round.bins.map((bin) => {
            let style = "border-amber-300 bg-amber-50 text-amber-700 hover:scale-[1.03]";
            if (selected) {
              if (bin === round.answer) style = "border-green-400 bg-green-100 text-green-700 scale-[1.03]";
              else if (bin === selected && !isCorrect) style = "border-red-300 bg-red-100 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else style = "border-gray-200 bg-gray-100 text-gray-400";
            }
            return <button key={bin} onClick={() => handleBin(bin)} disabled={!!selected} className={`rounded-2xl border-4 p-5 text-xl font-extrabold shadow-md transition-transform cursor-pointer ${style}`}>{bin}</button>;
          })}
        </div>
        {selected && <p className={`mt-5 text-center text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-orange-500"}`}>{isCorrect ? "🎉 Sorted!" : `It goes in ${round.answer}.`}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ MATH RACE ============

type RaceRound = {
  expression: string;
  answer: number;
  options: number[];
};

function buildRaceRounds(difficulty: Difficulty): RaceRound[] {
  return Array.from({ length: 8 }, () => {
    const max = difficulty === "easy" ? 6 : difficulty === "medium" ? 10 : 15;
    const useSubtraction = difficulty !== "easy" && Math.random() > 0.55;
    let left = Math.floor(Math.random() * max) + 1;
    let right = Math.floor(Math.random() * max) + 1;
    if (useSubtraction && right > left) [left, right] = [right, left];
    const answer = useSubtraction ? left - right : left + right;
    return {
      expression: `${left} ${useSubtraction ? "−" : "+"} ${right}`,
      answer,
      options: buildNumericOptions(answer, 0, 30),
    };
  });
}

function MathRaceGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<RaceRound[]>(() => buildRaceRounds(difficulty));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];

  function handleAnswer(option: number) {
    if (selected !== null) return;
    setSelected(option);
    const correct = option === round.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((value) => value + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((value) => value + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1400);
  }

  return (
    <GameWrapper title="Math Race" emoji="🏎️" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-red-50 via-orange-50 to-yellow-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-5 rounded-2xl bg-orange-50 p-4">
          <div className="mb-3 grid grid-cols-8 gap-1">
            {Array.from({ length: TOTAL }, (_, index) => (
              <div key={index} className={`flex h-10 items-center justify-center rounded-lg border text-lg ${index < score ? "border-green-300 bg-green-100" : index === score ? "border-orange-300 bg-orange-100" : "border-gray-200 bg-gray-50"}`}>
                {index === score ? "🏎️" : index < score ? "✓" : ""}
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-semibold text-orange-400">Solve to move the racer.</p>
        </div>
        <h2 className="mb-6 text-center text-5xl font-extrabold text-red-600">{round.expression} = ?</h2>
        <div className="flex justify-center gap-4">
          {round.options.map((option) => {
            let style = "border-orange-300 bg-orange-50 text-orange-700 hover:scale-[1.04]";
            if (selected !== null) {
              if (option === round.answer) style = "border-green-400 bg-green-100 text-green-700 scale-110";
              else if (option === selected && !isCorrect) style = "border-red-300 bg-red-100 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else style = "border-gray-200 bg-gray-100 text-gray-400";
            }
            return <button key={option} onClick={() => handleAnswer(option)} disabled={selected !== null} className={`flex h-20 w-20 items-center justify-center rounded-2xl border-4 text-4xl font-black shadow-md transition-transform cursor-pointer sm:h-24 sm:w-24 ${style}`}>{option}</button>;
          })}
        </div>
        {selected !== null && <p className={`mt-5 text-center text-2xl font-extrabold ${isCorrect ? "text-green-500" : "text-red-500"}`}>{isCorrect ? "🎉 Zoom!" : `${round.expression} = ${round.answer}`}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ ODD ONE OUT ============

type OddChoice = {
  label: string;
  emoji: string;
};

type OddRound = {
  prompt: string;
  choices: OddChoice[];
  answer: string;
  reason: string;
};

const oddRounds: OddRound[] = [
  { prompt: "Which one is not food?", choices: [{ label: "Apple", emoji: "🍎" }, { label: "Pizza", emoji: "🍕" }, { label: "Cake", emoji: "🎂" }, { label: "Car", emoji: "🚗" }], answer: "Car", reason: "A car is not food." },
  { prompt: "Which one is not an animal?", choices: [{ label: "Dog", emoji: "🐶" }, { label: "Cat", emoji: "🐱" }, { label: "Fish", emoji: "🐟" }, { label: "Sun", emoji: "☀️" }], answer: "Sun", reason: "The sun is not an animal." },
  { prompt: "Which one does not fly?", choices: [{ label: "Bird", emoji: "🐦" }, { label: "Airplane", emoji: "✈️" }, { label: "Butterfly", emoji: "🦋" }, { label: "Tree", emoji: "🌲" }], answer: "Tree", reason: "A tree stays in the ground." },
  { prompt: "Which one is not a shape?", choices: [{ label: "Circle", emoji: "●" }, { label: "Square", emoji: "■" }, { label: "Triangle", emoji: "▲" }, { label: "Banana", emoji: "🍌" }], answer: "Banana", reason: "A banana is food." },
  { prompt: "Which one is not in the sky?", choices: [{ label: "Moon", emoji: "🌙" }, { label: "Star", emoji: "⭐" }, { label: "Cloud", emoji: "☁️" }, { label: "Fish", emoji: "🐟" }], answer: "Fish", reason: "A fish swims in water." },
  { prompt: "Which one is not red?", choices: [{ label: "Apple", emoji: "🍎" }, { label: "Heart", emoji: "❤️" }, { label: "Stop sign", emoji: "🛑" }, { label: "Leaf", emoji: "🍃" }], answer: "Leaf", reason: "A leaf is green." },
  { prompt: "Which one starts with a different sound?", choices: [{ label: "Ball", emoji: "⚽" }, { label: "Book", emoji: "📘" }, { label: "Bird", emoji: "🐦" }, { label: "Cat", emoji: "🐱" }], answer: "Cat", reason: "Cat starts with C." },
  { prompt: "Which one is not for school?", choices: [{ label: "Book", emoji: "📘" }, { label: "Pencil", emoji: "✏️" }, { label: "Backpack", emoji: "🎒" }, { label: "Pizza", emoji: "🍕" }], answer: "Pizza", reason: "Pizza is food." },
];

function OddOneOutGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<OddRound[]>(() => shuffle(oddRounds).map((round) => ({ ...round, choices: shuffle(round.choices) })));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];

  function handleChoice(label: string) {
    if (selected) return;
    setSelected(label);
    const correct = label === round.answer;
    setIsCorrect(correct);
    if (correct) {
      setScore((value) => value + 1);
      fireConfetti();
    }
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        setCurrent((value) => value + 1);
        setSelected(null);
        setIsCorrect(null);
      }
    }, 1500);
  }

  return (
    <GameWrapper title="Odd One Out" emoji="🧐" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <h2 className="mb-5 text-center text-2xl font-extrabold text-violet-600 sm:text-3xl">{round.prompt}</h2>
        <div className="grid grid-cols-2 gap-3">
          {round.choices.map((choice) => {
            let style = "border-violet-300 bg-violet-50 text-violet-700 hover:scale-[1.03]";
            if (selected) {
              if (choice.label === round.answer) style = "border-green-400 bg-green-100 text-green-700 scale-[1.03]";
              else if (choice.label === selected && !isCorrect) style = "border-red-300 bg-red-100 text-red-500 animate-[shake_0.4s_ease-in-out]";
              else style = "border-gray-200 bg-gray-100 text-gray-400";
            }
            return (
              <button key={choice.label} onClick={() => handleChoice(choice.label)} disabled={!!selected} className={`rounded-2xl border-4 p-4 text-center shadow-md transition-transform cursor-pointer ${style}`}>
                <div className="text-5xl">{choice.emoji}</div>
                <div className="mt-2 text-lg font-extrabold">{choice.label}</div>
              </button>
            );
          })}
        </div>
        {selected && <p className={`mt-5 text-center text-xl font-extrabold sm:text-2xl ${isCorrect ? "text-green-500" : "text-violet-500"}`}>{isCorrect ? "🎉 You found it!" : round.reason}</p>}
      </div>
    </GameWrapper>
  );
}

// ============ STORY SEQUENCER ============

type StoryStep = {
  label: string;
  emoji: string;
};

type StoryRound = {
  title: string;
  steps: StoryStep[];
};

const storyBank: StoryRound[] = [
  { title: "Plant a Seed", steps: [{ label: "Seed", emoji: "🌱" }, { label: "Water", emoji: "💧" }, { label: "Sprout", emoji: "🌿" }, { label: "Flower", emoji: "🌸" }] },
  { title: "Make a Sandwich", steps: [{ label: "Bread", emoji: "🍞" }, { label: "Cheese", emoji: "🧀" }, { label: "Stack", emoji: "🥪" }, { label: "Eat", emoji: "😋" }] },
  { title: "Get Ready", steps: [{ label: "Wake", emoji: "⏰" }, { label: "Brush", emoji: "🪥" }, { label: "Backpack", emoji: "🎒" }, { label: "School", emoji: "🏫" }] },
  { title: "Build a Snowman", steps: [{ label: "Snow", emoji: "❄️" }, { label: "Roll", emoji: "⚪" }, { label: "Stack", emoji: "☃️" }, { label: "Smile", emoji: "😊" }] },
  { title: "Bake a Cake", steps: [{ label: "Mix", emoji: "🥣" }, { label: "Bake", emoji: "🔥" }, { label: "Decorate", emoji: "🎂" }, { label: "Share", emoji: "🍰" }] },
  { title: "Rainy Day", steps: [{ label: "Cloud", emoji: "☁️" }, { label: "Rain", emoji: "🌧️" }, { label: "Puddle", emoji: "💦" }, { label: "Rainbow", emoji: "🌈" }] },
  { title: "Trip", steps: [{ label: "Pack", emoji: "🧳" }, { label: "Car", emoji: "🚗" }, { label: "Map", emoji: "🗺️" }, { label: "Arrive", emoji: "🏖️" }] },
  { title: "Bedtime", steps: [{ label: "Pajamas", emoji: "🛌" }, { label: "Book", emoji: "📘" }, { label: "Moon", emoji: "🌙" }, { label: "Sleep", emoji: "💤" }] },
];

function buildStoryRounds(difficulty: Difficulty): StoryRound[] {
  return shuffle(storyBank).map((round) => ({
    ...round,
    steps: difficulty === "easy" ? round.steps.slice(0, 3) : round.steps,
  }));
}

function StorySequencerGame({ onComplete, onBack, difficulty }: GameProps) {
  const TOTAL = 8;
  const [rounds] = useState<StoryRound[]>(() => buildStoryRounds(difficulty).slice(0, TOTAL));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [choices, setChoices] = useState<StoryStep[]>(() => shuffle(rounds[0].steps));
  const [selected, setSelected] = useState<StoryStep[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const round = rounds[current];

  function goNext(correct: boolean) {
    setTimeout(() => {
      if (current + 1 >= TOTAL) onComplete(score + (correct ? 1 : 0), TOTAL);
      else {
        const nextIndex = current + 1;
        setCurrent(nextIndex);
        setSelected([]);
        setChoices(shuffle(rounds[nextIndex].steps));
        setIsCorrect(null);
      }
    }, 1600);
  }

  function handleStep(step: StoryStep) {
    if (isCorrect !== null || selected.some((item) => item.label === step.label)) return;
    const nextSelected = [...selected, step];
    setSelected(nextSelected);
    if (nextSelected.length === round.steps.length) {
      const correct = nextSelected.every((item, index) => item.label === round.steps[index].label);
      setIsCorrect(correct);
      if (correct) {
        setScore((value) => value + 1);
        fireConfetti();
      }
      goNext(correct);
    }
  }

  return (
    <GameWrapper title="Story Sequencer" emoji="📖" current={current} total={TOTAL} score={score} onBack={onBack} bgGradient="bg-gradient-to-br from-slate-50 via-sky-50 to-indigo-100" difficulty={difficulty}>
      <div className="w-full rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="mb-4 text-center">
          <h2 className="text-2xl font-extrabold text-sky-700 sm:text-3xl">{round.title}</h2>
          <p className="mt-1 text-sm font-semibold text-sky-300">Tap the pictures in story order.</p>
        </div>
        <div className="mb-5 flex justify-center gap-2 rounded-2xl bg-sky-50 p-4">
          {round.steps.map((_, index) => (
            <div key={index} className={`flex h-20 w-20 flex-col items-center justify-center rounded-xl border-4 text-center ${isCorrect === false ? "border-red-300 bg-red-50" : "border-sky-300 bg-white"}`}>
              <span className="text-3xl">{selected[index]?.emoji ?? ""}</span>
              <span className="mt-1 text-[11px] font-extrabold text-sky-700">{selected[index]?.label ?? ""}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {choices.map((step) => {
            const used = selected.some((item) => item.label === step.label);
            return (
              <button key={step.label} onClick={() => handleStep(step)} disabled={used || isCorrect !== null} className={`rounded-2xl border-4 p-3 text-center shadow-md transition-transform cursor-pointer ${used ? "border-gray-200 bg-gray-100 text-gray-300" : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:scale-[1.03] active:scale-95"}`}>
                <div className="text-4xl">{step.emoji}</div>
                <div className="mt-1 text-sm font-extrabold">{step.label}</div>
              </button>
            );
          })}
        </div>
        {isCorrect !== null && <p className={`mt-5 text-center text-xl font-extrabold sm:text-2xl ${isCorrect ? "text-green-500" : "text-sky-600"}`}>{isCorrect ? "🎉 Great story!" : `Order: ${round.steps.map((step) => step.label).join(" → ")}`}</p>}
      </div>
    </GameWrapper>
  );
}

const gameRegistry: GameRegistryEntry[] = [
  { key: "counting", emoji: "🔢", title: "Counting Fun", subtitle: "Count, group, and make 10", gradient: "from-blue-400 to-cyan-500", bg: "bg-blue-50", total: () => 8, component: CountingGame, achievement: { id: "counting-star", label: "Counting Star", emoji: "🔢" } },
  { key: "colors", emoji: "🎨", title: "Color Quiz", subtitle: "Colors, shades, and shape clues", gradient: "from-purple-400 to-pink-500", bg: "bg-purple-50", total: () => 8, component: ColorGame, achievement: { id: "color-pro", label: "Color Pro", emoji: "🎨" } },
  { key: "shapes", emoji: "🔷", title: "Shape Match", subtitle: "Names, sides, and real-world clues", gradient: "from-teal-400 to-emerald-500", bg: "bg-teal-50", total: () => 8, component: ShapeGame, achievement: { id: "shape-scout", label: "Shape Scout", emoji: "🔷" } },
  { key: "math", emoji: "➕", title: "Math Fun", subtitle: "Add, subtract, and fill in the blank", gradient: "from-rose-400 to-red-500", bg: "bg-rose-50", total: () => 8, component: MathGame, achievement: { id: "math-star", label: "Math Star", emoji: "➕" } },
  { key: "pattern", emoji: "🧩", title: "Pattern Fun", subtitle: "AB, AAB, ABC, and more", gradient: "from-indigo-400 to-violet-500", bg: "bg-indigo-50", total: () => 8, component: PatternGame, achievement: { id: "pattern-detective", label: "Pattern Detective", emoji: "🧩" } },
  { key: "compare", emoji: "📏", title: "Compare Numbers", subtitle: "Greater, less, equal, and ordering", gradient: "from-amber-400 to-yellow-500", bg: "bg-amber-50", total: () => 8, component: CompareGame, achievement: { id: "compare-captain", label: "Compare Captain", emoji: "📏" } },
  { key: "phonics", emoji: "📚", title: "Phonics Fun", subtitle: "Beginning sounds and rhymes", gradient: "from-lime-400 to-green-500", bg: "bg-lime-50", total: (difficulty) => difficulty === "hard" ? 10 : 8, component: PhonicsGame, achievement: { id: "reading-rockstar", label: "Reading Rockstar", emoji: "📚" } },
  { key: "bubbles", emoji: "🫧", title: "Bubble Pop", subtitle: "Pop the letter bubbles!", gradient: "from-sky-400 to-blue-500", bg: "bg-sky-50", total: () => 8, component: BubblePopGame, achievement: { id: "bubble-master", label: "Bubble Master", emoji: "🫧" } },
  { key: "memory", emoji: "🧠", title: "Memory Match", subtitle: "Flip cards and find pairs", gradient: "from-fuchsia-400 to-pink-500", bg: "bg-fuchsia-50", total: getMemoryPairCount, component: MemoryMatchGame, achievement: { id: "memory-champion", label: "Memory Champion", emoji: "🧠" } },
  { key: "train", emoji: "🚂", title: "Number Train", subtitle: "Put number cars in order", gradient: "from-cyan-400 to-blue-500", bg: "bg-cyan-50", total: () => 8, component: NumberTrainGame, achievement: { id: "train-conductor", label: "Train Conductor", emoji: "🚂" } },
  { key: "words", emoji: "🔤", title: "Word Builder", subtitle: "Tap letters to spell words", gradient: "from-emerald-400 to-lime-500", bg: "bg-emerald-50", total: getWordRoundTotal, component: WordBuilderGame, achievement: { id: "word-builder", label: "Word Builder", emoji: "🔤" } },
  { key: "shapebuilder", emoji: "🧱", title: "Shape Builder", subtitle: "Choose shapes to build pictures", gradient: "from-teal-400 to-cyan-500", bg: "bg-teal-50", total: () => 8, component: ShapeBuilderGame, achievement: { id: "picture-builder", label: "Picture Builder", emoji: "🧱" } },
  { key: "sort", emoji: "🧺", title: "Treasure Sort", subtitle: "Sort by color, group, or sound", gradient: "from-orange-400 to-amber-500", bg: "bg-orange-50", total: () => 8, component: TreasureSortGame, achievement: { id: "sorting-star", label: "Sorting Star", emoji: "🧺" } },
  { key: "race", emoji: "🏎️", title: "Math Race", subtitle: "Solve to move the racer", gradient: "from-red-400 to-orange-500", bg: "bg-red-50", total: () => 8, component: MathRaceGame, achievement: { id: "math-racer", label: "Math Racer", emoji: "🏎️" } },
  { key: "oddone", emoji: "🧐", title: "Odd One Out", subtitle: "Find what does not belong", gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50", total: () => 8, component: OddOneOutGame, achievement: { id: "category-detective", label: "Category Detective", emoji: "🧐" } },
  { key: "story", emoji: "📖", title: "Story Sequencer", subtitle: "Put picture stories in order", gradient: "from-sky-400 to-indigo-500", bg: "bg-sky-50", total: () => 8, component: StorySequencerGame, achievement: { id: "storyteller", label: "Storyteller", emoji: "📖" } },
];

const playableModes = gameRegistry.map((game) => game.key);
