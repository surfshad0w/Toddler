// ============ FIND IT! (Emoji Match) ============
export interface FindItQuestion {
  word: string;
  correctEmoji: string;
  options: string[];
}

export const findItQuestions: FindItQuestion[] = [
  { word: "Apple", correctEmoji: "🍎", options: ["🍎", "🍌", "🍇"] },
  { word: "Dog", correctEmoji: "🐶", options: ["🐱", "🐶", "🐸"] },
  { word: "Sun", correctEmoji: "☀️", options: ["🌙", "⭐", "☀️"] },
  { word: "Fish", correctEmoji: "🐟", options: ["🐟", "🐦", "🐛"] },
  { word: "Car", correctEmoji: "🚗", options: ["🚲", "🚗", "✈️"] },
  { word: "Star", correctEmoji: "⭐", options: ["🌙", "☀️", "⭐"] },
  { word: "Flower", correctEmoji: "🌸", options: ["🌸", "🌲", "🍀"] },
  { word: "Cat", correctEmoji: "🐱", options: ["🐶", "🐰", "🐱"] },
  { word: "Moon", correctEmoji: "🌙", options: ["☀️", "🌙", "⭐"] },
  { word: "Banana", correctEmoji: "🍌", options: ["🍎", "🍊", "🍌"] },
  { word: "Bird", correctEmoji: "🐦", options: ["🐦", "🐟", "🦋"] },
  { word: "Cake", correctEmoji: "🎂", options: ["🍕", "🎂", "🍪"] },
  { word: "Tree", correctEmoji: "🌲", options: ["🌸", "🌲", "🍄"] },
  { word: "Butterfly", correctEmoji: "🦋", options: ["🐛", "🦋", "🐝"] },
  { word: "Pizza", correctEmoji: "🍕", options: ["🍕", "🍔", "🌮"] },
  { word: "Rabbit", correctEmoji: "🐰", options: ["🐱", "🐭", "🐰"] },
  { word: "Rainbow", correctEmoji: "🌈", options: ["🌈", "☀️", "🌧️"] },
  { word: "Balloon", correctEmoji: "🎈", options: ["🎈", "🎁", "🎀"] },
  { word: "Heart", correctEmoji: "❤️", options: ["⭐", "❤️", "💎"] },
  { word: "Airplane", correctEmoji: "✈️", options: ["🚗", "🚀", "✈️"] },
];

// ============ COUNTING ============
export interface CountingQuestion {
  emoji: string;
  count: number;
  options: number[];
}

export function generateCountingQuestions(): CountingQuestion[] {
  const emojis = ["🍎", "🌟", "🐟", "🦋", "🌸", "🍕", "🎈", "🐣", "🍓", "🌈", "🍪", "🧁", "🎀", "🐞"];
  const questions: CountingQuestion[] = [];

  for (let i = 0; i < 12; i++) {
    const emoji = emojis[i % emojis.length];
    const count = Math.floor(Math.random() * 8) + 1; // 1-8
    const options = generateCountOptions(count);
    questions.push({ emoji, count, options });
  }

  return questions;
}

function generateCountOptions(correct: number): number[] {
  const opts = new Set<number>([correct]);
  while (opts.size < 3) {
    let candidate: number;
    if (correct <= 2) {
      candidate = correct + Math.floor(Math.random() * 3) + 1;
    } else {
      candidate = correct + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
    }
    if (candidate > 0 && candidate <= 10) opts.add(candidate);
  }
  return shuffle(Array.from(opts));
}

// ============ COLOR QUIZ ============
export interface ColorQuestion {
  colorName: string;
  colorHex: string;
  shape: string;
  options: string[];
}

export const colorQuestions: ColorQuestion[] = [
  { colorName: "Red", colorHex: "#EF4444", shape: "●", options: ["Red", "Blue", "Green"] },
  { colorName: "Blue", colorHex: "#3B82F6", shape: "■", options: ["Yellow", "Blue", "Red"] },
  { colorName: "Green", colorHex: "#22C55E", shape: "▲", options: ["Green", "Purple", "Orange"] },
  { colorName: "Yellow", colorHex: "#EAB308", shape: "★", options: ["Blue", "Yellow", "Pink"] },
  { colorName: "Purple", colorHex: "#A855F7", shape: "♥", options: ["Green", "Red", "Purple"] },
  { colorName: "Orange", colorHex: "#F97316", shape: "●", options: ["Orange", "Yellow", "Brown"] },
  { colorName: "Pink", colorHex: "#EC4899", shape: "♦", options: ["Red", "Pink", "Purple"] },
  { colorName: "Brown", colorHex: "#92400E", shape: "■", options: ["Orange", "Brown", "Red"] },
  { colorName: "Black", colorHex: "#1F2937", shape: "★", options: ["Blue", "Gray", "Black"] },
  { colorName: "White", colorHex: "#F9FAFB", shape: "●", options: ["White", "Yellow", "Pink"] },
  { colorName: "Gray", colorHex: "#9CA3AF", shape: "▲", options: ["White", "Black", "Gray"] },
];

// ============ SHAPE QUIZ ============
export interface ShapeQuestion {
  shapeName: string;
  shapeEmoji: string;
  options: string[];
}

export const shapeQuestions: ShapeQuestion[] = [
  { shapeName: "Circle", shapeEmoji: "⬤", options: ["Circle", "Square", "Triangle"] },
  { shapeName: "Square", shapeEmoji: "⬛", options: ["Circle", "Square", "Diamond"] },
  { shapeName: "Triangle", shapeEmoji: "▲", options: ["Triangle", "Circle", "Star"] },
  { shapeName: "Star", shapeEmoji: "★", options: ["Heart", "Star", "Diamond"] },
  { shapeName: "Heart", shapeEmoji: "♥", options: ["Heart", "Circle", "Star"] },
  { shapeName: "Diamond", shapeEmoji: "◆", options: ["Square", "Triangle", "Diamond"] },
  { shapeName: "Oval", shapeEmoji: "⬮", options: ["Circle", "Oval", "Rectangle"] },
  { shapeName: "Rectangle", shapeEmoji: "▬", options: ["Square", "Rectangle", "Triangle"] },
  { shapeName: "Crescent", shapeEmoji: "🌙", options: ["Circle", "Star", "Crescent"] },
  { shapeName: "Cross", shapeEmoji: "✚", options: ["Star", "Cross", "Diamond"] },
  { shapeName: "Arrow", shapeEmoji: "➤", options: ["Triangle", "Arrow", "Star"] },
  { shapeName: "Hexagon", shapeEmoji: "⬡", options: ["Circle", "Hexagon", "Pentagon"] },
];

// ============ MATH FUN ============
export interface MathQuestion {
  num1: number;
  num2: number;
  operator: "+" | "−";
  answer: number;
  emoji: string;
  options: number[];
}

export function generateMathQuestions(): MathQuestion[] {
  const emojis = ["🍎", "🌟", "🍪", "🐟", "🎈", "🍓", "🐣", "🌸", "🍕", "🧁", "🐞", "🦋"];
  const questions: MathQuestion[] = [];

  for (let i = 0; i < 14; i++) {
    const emoji = emojis[i % emojis.length];
    const isAddition = Math.random() > 0.4; // slightly more addition

    let num1: number, num2: number, answer: number;
    const op: "+" | "−" = isAddition ? "+" : "−";

    if (isAddition) {
      num1 = Math.floor(Math.random() * 5) + 1; // 1-5
      num2 = Math.floor(Math.random() * 5) + 1; // 1-5
      answer = num1 + num2;
    } else {
      answer = Math.floor(Math.random() * 5) + 1; // 1-5
      num2 = Math.floor(Math.random() * 4) + 1; // 1-4
      num1 = answer + num2; // ensures no negatives
    }

    const options = generateMathOptions(answer);
    questions.push({ num1, num2, operator: op, answer, emoji, options });
  }

  return questions;
}

function generateMathOptions(correct: number): number[] {
  const opts = new Set<number>([correct]);
  while (opts.size < 3) {
    let candidate: number;
    if (correct <= 2) {
      candidate = correct + Math.floor(Math.random() * 3) + 1;
    } else {
      candidate = correct + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 2) + 1);
    }
    if (candidate > 0 && candidate <= 12) opts.add(candidate);
  }
  return shuffle(Array.from(opts));
}

// ============ PATTERN FUN ============
export interface PatternQuestion {
  pattern: string[];
  answer: string;
  options: string[];
}

export function generatePatternQuestions(): PatternQuestion[] {
  const patternSets: { items: string[]; repeat: number }[] = [
    { items: ["🔴", "🔵"], repeat: 2 },
    { items: ["🌟", "🌙"], repeat: 2 },
    { items: ["🍎", "🍌"], repeat: 2 },
    { items: ["🐱", "🐶"], repeat: 2 },
    { items: ["🌸", "🌻"], repeat: 2 },
    { items: ["❤️", "💙"], repeat: 2 },
    { items: ["🟢", "🟡"], repeat: 2 },
    { items: ["🦋", "🐛"], repeat: 2 },
    { items: ["🍕", "🍔"], repeat: 2 },
    { items: ["🎈", "🎁"], repeat: 2 },
    { items: ["🔴", "🔵", "🟢"], repeat: 1 },
    { items: ["🍎", "🍊", "🍌"], repeat: 1 },
    { items: ["⭐", "🌙", "☀️"], repeat: 1 },
    { items: ["🐶", "🐱", "🐰"], repeat: 1 },
    { items: ["❤️", "💛", "💙"], repeat: 1 },
    { items: ["🌸", "🌼", "🌻"], repeat: 1 },
  ];

  const selected = shuffle(patternSets).slice(0, 12);
  const questions: PatternQuestion[] = [];

  for (const ps of selected) {
    const fullPattern: string[] = [];
    const totalRepeats = ps.items.length === 2 ? 3 : 2;
    for (let r = 0; r < totalRepeats; r++) {
      for (const item of ps.items) {
        fullPattern.push(item);
      }
    }
    // The answer is the last element, we show pattern without last
    const answer = fullPattern[fullPattern.length - 1];
    const shown = fullPattern.slice(0, fullPattern.length - 1);

    // Generate wrong options from other emojis
    const allEmojis = ["🔴", "🔵", "🟢", "🟡", "🍎", "🍌", "🍊", "🌟", "🌙", "☀️", "🐱", "🐶", "🐰", "🌸", "🌻", "🌼", "❤️", "💙", "💛", "🦋", "🐛", "🍕", "🍔", "🎈", "🎁"];
    const wrongOptions = shuffle(allEmojis.filter((e) => e !== answer && !ps.items.includes(e))).slice(0, 2);
    const options = shuffle([answer, ...wrongOptions]);

    questions.push({ pattern: shown, answer, options });
  }

  return questions;
}

// ============ BIGGER OR SMALLER ============
export interface CompareQuestion {
  labelA: string;
  valueA: number;
  labelB: string;
  valueB: number;
  answer: ">" | "<" | "=";
  type: "numbers" | "expression";
}

export function generateCompareQuestions(): CompareQuestion[] {
  const questions: CompareQuestion[] = [];

  // Type 1: Compare two plain numbers (2-digit, 10-99)
  for (let i = 0; i < 5; i++) {
    const a = Math.floor(Math.random() * 90) + 10; // 10-99
    let b = Math.floor(Math.random() * 90) + 10;
    // Sometimes make them equal
    if (i === 3) b = a;
    else while (b === a) b = Math.floor(Math.random() * 90) + 10;
    const answer: ">" | "<" | "=" = a > b ? ">" : a < b ? "<" : "=";
    questions.push({ labelA: `${a}`, valueA: a, labelB: `${b}`, valueB: b, answer, type: "numbers" });
  }

  // Type 2: Compare simple addition expressions
  for (let i = 0; i < 4; i++) {
    const a1 = Math.floor(Math.random() * 15) + 5; // 5-19
    const a2 = Math.floor(Math.random() * 10) + 1; // 1-10
    const b1 = Math.floor(Math.random() * 15) + 5;
    const b2 = Math.floor(Math.random() * 10) + 1;
    const sumA = a1 + a2;
    const sumB = b1 + b2;
    const answer: ">" | "<" | "=" = sumA > sumB ? ">" : sumA < sumB ? "<" : "=";
    questions.push({
      labelA: `${a1} + ${a2}`,
      valueA: sumA,
      labelB: `${b1} + ${b2}`,
      valueB: sumB,
      answer,
      type: "expression",
    });
  }

  // Type 3: Compare a number vs an expression
  for (let i = 0; i < 3; i++) {
    const plain = Math.floor(Math.random() * 20) + 5; // 5-24
    const e1 = Math.floor(Math.random() * 15) + 3;
    const e2 = Math.floor(Math.random() * 10) + 1;
    const exprVal = e1 + e2;
    const answer: ">" | "<" | "=" = plain > exprVal ? ">" : plain < exprVal ? "<" : "=";
    // Randomly put number on left or right
    if (Math.random() > 0.5) {
      questions.push({ labelA: `${plain}`, valueA: plain, labelB: `${e1} + ${e2}`, valueB: exprVal, answer, type: "expression" });
    } else {
      const flipped: ">" | "<" | "=" = answer === ">" ? "<" : answer === "<" ? ">" : "=";
      questions.push({ labelA: `${e1} + ${e2}`, valueA: exprVal, labelB: `${plain}`, valueB: plain, answer: flipped, type: "expression" });
    }
  }

  return shuffle(questions);
}

// ============ HELPERS ============
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
