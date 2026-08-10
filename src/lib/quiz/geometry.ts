import type { Question, Depth } from "./types";
import { mulberry32, randInt, buildOptions } from "./core";

type GenFn = (seed: number, idx: number) => Question;

const pointsLinesPlanes: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const x1 = randInt(seed, 1, 4);
    const y1 = randInt(seed + 1, 1, 4);
    const x2 = randInt(seed + 2, 5, 9);
    const y2 = randInt(seed + 3, 1, 4);
    const dx = x2 - x1; const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy).toFixed(2);
    const correct = dist;
    const wrongs = [String(Math.abs(dx) + Math.abs(dy)), (Math.abs(dx) * Math.abs(dy)).toFixed(2), String(Math.max(Math.abs(dx), Math.abs(dy)))];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the distance between \\((${x1}, ${y1})\\) and \\((${x2}, ${y2})\\).`, options, correctIndex,
      explanation: `Distance = \\(\\sqrt{(${x2} - ${x1})^2 + (${y2} - ${y1})^2} = \\sqrt{${dx}^2 + ${dy}^2} = \\sqrt{${dx * dx + dy * dy}} \\approx ${correct}\\).`,
      difficulty: "easy", topic: "Points, Lines & Planes", subtopic: "points-lines-planes",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const x1 = randInt(seed, 2, 5); const y1 = randInt(seed + 1, 2, 5);
    const x2 = randInt(seed + 2, 5, 8); const y2 = randInt(seed + 3, 5, 8);
    const mx = ((x1 + x2) / 2); const my = ((y1 + y2) / 2);
    const correct = `(${mx % 1 === 0 ? mx : mx.toFixed(1)}, ${my % 1 === 0 ? my : my.toFixed(1)})`;
    const fmt = (v: number) => v % 1 === 0 ? String(v) : v.toFixed(1);
    const wrongs = [`(${fmt((x1 + x2) / 2 + 1)}, ${fmt((y1 + y2) / 2)})`, `(${fmt(x2 - x1)}, ${fmt(y2 - y1)})`, `(${fmt(x1)}, ${fmt(y2)})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the midpoint of \\((${x1}, ${y1})\\) and \\((${x2}, ${y2})\\).`, options, correctIndex,
      explanation: `Midpoint = \\(\\left(\\frac{${x1}+${x2}}{2}, \\frac{${y1}+${y2}}{2}\\right) = ${correct}\\).`,
      difficulty: "medium", topic: "Points, Lines & Planes", subtopic: "points-lines-planes",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const m = randInt(seed, 2, 4);
    const correct = String(m);
    const wrongs = [String(-m), String(1 / m), String(-1 / m)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `A line perpendicular to \\(y = -\\frac{1}{${m}}x + 3\\) has what slope?`, options, correctIndex,
      explanation: `Perpendicular slopes are negative reciprocals: \\(m_1 \\cdot m_2 = -1\\). If \\(m_1 = -\\frac{1}{${m}}\\), then \\(m_2 = -\\frac{1}{-1/${m}} = ${m}\\).`,
      difficulty: "hard", topic: "Points, Lines & Planes", subtopic: "points-lines-planes",
    };
  },
};

const angles: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 20, 70);
    const correct = String(180 - a);
    const wrongs = [String(a), String(90 - a), String(360 - a)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Two angles are supplementary. If one angle is \\(${a}°\\), what is the other?`, options, correctIndex,
      explanation: `Supplementary angles sum to 180°. So the other angle is \\(180° - ${a}° = ${correct}°\\).`,
      difficulty: "easy", topic: "Angles", subtopic: "angles",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 20, 60);
    const correct = String(90 - a);
    const wrongs = [String(a), String(180 - a), String(360 - a)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Two angles are complementary. If one angle is \\(${a}°\\), what is the other?`, options, correctIndex,
      explanation: `Complementary angles sum to 90°. So the other angle is \\(90° - ${a}° = ${correct}°\\).`,
      difficulty: "medium", topic: "Angles", subtopic: "angles",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const n = randInt(seed, 5, 8);
    const interior = (n - 2) * 180;
    const each = Math.round(interior / n);
    const correct = String(each);
    const wrongs = [String(180 - each), String(Math.round(180 / n)), String(360 / n)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is the measure of each interior angle of a regular \\(${n}\\)-gon?`, options, correctIndex,
      explanation: `Sum of interior angles = \\((${n} - 2) \\times 180° = ${interior}°\\). Each angle = \\(${interior}° \\div ${n} = ${each}°\\).`,
      difficulty: "hard", topic: "Angles", subtopic: "angles",
    };
  },
};

const triangles: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 30, 50);
    const b = randInt(seed + 1, 30, 50);
    const correct = String(180 - a - b);
    const wrongs = [String(a + b), String(Math.abs(a - b)), String(90)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `A triangle has angles \\(${a}°\\) and \\(${b}°\\). What is the third angle?`, options, correctIndex,
      explanation: `Angles in a triangle sum to 180°. Third angle = \\(180° - ${a}° - ${b}° = ${correct}°\\).`,
      difficulty: "easy", topic: "Triangles", subtopic: "triangles",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const a = randInt(seed, 3, 6);
    const b = randInt(seed + 1, 4, 8);
    const c = Math.sqrt(a * a + b * b);
    const correct = c % 1 === 0 ? String(c) : c.toFixed(2);
    const wrongs = [String(a + b), String(Math.abs(a - b)), String(Math.round(c) + 1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the hypotenuse of a right triangle with legs \\(${a}\\) and \\(${b}\\).`, options, correctIndex,
      explanation: `Pythagorean theorem: \\(c = \\sqrt{${a}^2 + ${b}^2} = \\sqrt{${a * a + b * b}}${c % 1 === 0 ? ` = ${correct}` : ` \\approx ${correct}`}\\).`,
      difficulty: "medium", topic: "Triangles", subtopic: "triangles",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const base = randInt(seed, 4, 8);
    const height = randInt(seed + 1, 3, 7);
    const area = (base * height) / 2;
    const correct = area % 1 === 0 ? String(area) : area.toFixed(1);
    const wrongs = [String(base * height), String(base + height), String(Math.round(base * height / 3))];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the area of a triangle with base \\(${base}\\) and height \\(${height}\\).`, options, correctIndex,
      explanation: `Area = \\(\\frac{1}{2} \\times ${base} \\times ${height} = ${correct}\\).`,
      difficulty: "hard", topic: "Triangles", subtopic: "triangles",
    };
  },
};

const circles: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const r = randInt(seed, 3, 8);
    const circ = (2 * Math.PI * r).toFixed(1);
    const correct = circ;
    const wrongs = [(Math.PI * r).toFixed(1), (Math.PI * r * r).toFixed(1), String(2 * r)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the circumference of a circle with radius \\(${r}\\). Use \\(\\pi \\approx 3.14\\).`, options, correctIndex,
      explanation: `Circumference = \\(2\\pi r = 2 \\times 3.14 \\times ${r} \\approx ${correct}\\).`,
      difficulty: "easy", topic: "Circles", subtopic: "circles",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const r = randInt(seed, 3, 7);
    const area = (Math.PI * r * r).toFixed(1);
    const correct = area;
    const wrongs = [(2 * Math.PI * r).toFixed(1), String(2 * r), (Math.PI * r).toFixed(1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the area of a circle with radius \\(${r}\\). Use \\(\\pi \\approx 3.14\\).`, options, correctIndex,
      explanation: `Area = \\(\\pi r^2 = 3.14 \\times ${r}^2 = 3.14 \\times ${r * r} \\approx ${correct}\\).`,
      difficulty: "medium", topic: "Circles", subtopic: "circles",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const d = randInt(seed, 6, 12);
    const arc = randInt(seed + 1, 30, 120);
    const len = (arc / 360 * Math.PI * d).toFixed(1);
    const correct = len;
    const wrongs = [(arc / 360 * d).toFixed(1), (Math.PI * d).toFixed(1), (arc * d / 180).toFixed(1)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the arc length of a \\(${arc}°\\) arc in a circle with diameter \\(${d}\\).`, options, correctIndex,
      explanation: `Arc length = \\(\\frac{${arc}}{360} \\times \\pi d = \\frac{${arc}}{360} \\times \\pi \\times ${d} \\approx ${correct}\\).`,
      difficulty: "hard", topic: "Circles", subtopic: "circles",
    };
  },
};

const polygons: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const l = randInt(seed, 3, 7);
    const w = randInt(seed + 1, 3, 7);
    const correct = String(l * w);
    const wrongs = [String(2 * (l + w)), String(l + w), String(l * w + 2)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the area of a rectangle with length \\(${l}\\) and width \\(${w}\\).`, options, correctIndex,
      explanation: `Area of rectangle = length × width = \\(${l} \\times ${w} = ${correct}\\).`,
      difficulty: "easy", topic: "Polygons", subtopic: "polygons",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const b1 = randInt(seed, 3, 6);
    const b2 = randInt(seed + 1, 5, 9);
    const h = randInt(seed + 2, 3, 6);
    const area = ((b1 + b2) / 2 * h);
    const correct = area % 1 === 0 ? String(area) : area.toFixed(1);
    const wrongs = [String((b1 * b2) / 2), String(b1 * h), String(b1 + b2 + h)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the area of a trapezoid with bases \\(${b1}\\) and \\(${b2}\\) and height \\(${h}\\).`, options, correctIndex,
      explanation: `Area = \\(\\frac{b_1 + b_2}{2} \\times h = \\frac{${b1} + ${b2}}{2} \\times ${h} = ${correct}\\).`,
      difficulty: "medium", topic: "Polygons", subtopic: "polygons",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const s = randInt(seed, 4, 7);
    const apothem = (s / (2 * Math.tan(Math.PI / 6))).toFixed(1);
    const perimeter = 6 * s;
    const area = (perimeter * Number(apothem) / 2).toFixed(1);
    const correct = area;
    const wrongs = [(s * s * 1.5).toFixed(1), (s * s * 3).toFixed(1), String(6 * s * s)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the area of a regular hexagon with side length \\(${s}\\).`, options, correctIndex,
      explanation: `For a regular hexagon, area = \\(\\frac{3\\sqrt{3}}{2} s^2 = \\frac{3\\sqrt{3}}{2} \\times ${s * s} \\approx ${(3 * Math.sqrt(3) * s * s / 2).toFixed(1)}\\). The closest match is \\(${correct}\\).`,
      difficulty: "hard", topic: "Polygons", subtopic: "polygons",
    };
  },
};

const transformations: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 5);
    const y = randInt(seed + 1, 2, 5);
    const dx = randInt(seed + 2, -3, 3);
    const dy = randInt(seed + 3, -3, 3);
    const correct = `(${x + dx}, ${y + dy})`;
    const wrongs = [`(${x - dx}, ${y - dy})`, `(${x}, ${y})`, `(${dx}, ${dy})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Translate the point \\((${x}, ${y})\\) by \\((${dx >= 0 ? "+" : ""}${dx}, ${dy >= 0 ? "+" : ""}${dy})\\). What are the new coordinates?`, options, correctIndex,
      explanation: `Add the translation vector: \\((${x} + (${dx}), ${y} + (${dy})) = ${correct}\\).`,
      difficulty: "easy", topic: "Transformations", subtopic: "transformations",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 5);
    const y = randInt(seed + 1, 2, 5);
    const correct = `(${-y}, ${x})`;
    const wrongs = [`(${y}, ${-x})`, `(${-x}, ${-y})`, `(${y}, ${x})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Rotate the point \\((${x}, ${y})\\) by 90° counterclockwise about the origin.`, options, correctIndex,
      explanation: `For a 90° CCW rotation: \\((x, y) \\to (-y, x)\\). So \\((${x}, ${y}) \\to ${correct}\\).`,
      difficulty: "medium", topic: "Transformations", subtopic: "transformations",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const x = randInt(seed, 2, 5);
    const y = randInt(seed + 1, 2, 5);
    const correct = `(${x}, ${-y})`;
    const wrongs = [`(${-x}, ${y})`, `(${-x}, ${-y})`, `(${y}, ${x})`];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Reflect the point \\((${x}, ${y})\\) across the x-axis.`, options, correctIndex,
      explanation: `Reflection across the x-axis keeps x the same and negates y: \\((x, y) \\to (x, -y)\\). So \\((${x}, ${y}) \\to ${correct}\\).`,
      difficulty: "hard", topic: "Transformations", subtopic: "transformations",
    };
  },
};

const coordinateGeometry: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const m = randInt(seed, 2, 5);
    const b = randInt(seed + 1, -3, 5);
    const x = randInt(seed + 2, 1, 4);
    const correct = String(m * x + b);
    const wrongs = [String(m * x), String(b), String(m * x - b)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Evaluate \\(y = ${m}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}\\) when \\(x = ${x}\\).`, options, correctIndex,
      explanation: `Substitute \\(x = ${x}\\): \\(y = ${m}(${x}) ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${m * x} ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${correct}\\).`,
      difficulty: "easy", topic: "Coordinate Geometry", subtopic: "coordinate-geometry",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const h = randInt(seed, -3, 3);
    const k = randInt(seed + 1, -3, 3);
    const r = randInt(seed + 2, 2, 5);
    const correct = `(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})^2 + (y ${k > 0 ? "-" : "+"} ${Math.abs(k)})^2 = ${r * r}`;
    const wrongs = [
      `(x + ${Math.abs(h)})^2 + (y + ${Math.abs(k)})^2 = ${r * r}`,
      `(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})^2 + (y ${k > 0 ? "-" : "+"} ${Math.abs(k)})^2 = ${r}`,
      `x^2 + y^2 = ${r * r}`,
    ];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Write the equation of a circle with center \\((${h}, ${k})\\) and radius \\(${r}\\).`, options, correctIndex,
      explanation: `Standard form: \\((x - h)^2 + (y - k)^2 = r^2\\). With \\(h = ${h}, k = ${k}, r = ${r}\\): \\(${correct}\\).`,
      difficulty: "medium", topic: "Coordinate Geometry", subtopic: "coordinate-geometry",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const x1 = randInt(seed, 1, 3); const y1 = randInt(seed + 1, 1, 4);
    const x2 = randInt(seed + 2, 5, 8); const y2 = randInt(seed + 3, 5, 9);
    const dx = x2 - x1; const dy = y2 - y1;
    const m = dy / dx;
    const mStr = m % 1 === 0 ? String(m) : `${dy}/${dx}`;
    const correct = mStr;
    const wrongs = [String(Math.round(m) + 1), String(-m % 1 === 0 ? -m : `${-dy}/${dx}`), String(dx / dy)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Find the slope of the line through \\((${x1}, ${y1})\\) and \\((${x2}, ${y2})\\).`, options, correctIndex,
      explanation: `Slope = \\(\\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${y2} - ${y1}}{${x2} - ${x1}} = ${correct}\\).`,
      difficulty: "hard", topic: "Coordinate Geometry", subtopic: "coordinate-geometry",
    };
  },
};

const trigonometryBasics: Record<Depth, GenFn> = {
  core: (seed, idx) => {
    const rng = mulberry32(seed);
    const deg = randInt(seed, 0, 1) === 0 ? 30 : randInt(seed, 0, 1) === 0 ? 45 : 60;
    const sinMap: Record<number, string> = { 30: "1/2", 45: "\\sqrt{2}/2", 60: "\\sqrt{3}/2" };
    const correct = sinMap[deg];
    const wrongs = deg === 30 ? ["\\sqrt{2}/2", "1", "\\sqrt{3}/2"] : deg === 45 ? ["1/2", "1", "\\sqrt{3}/2"] : ["1/2", "\\sqrt{2}/2", "1"];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `What is \\(\\sin(${deg}°)\\)?`, options, correctIndex,
      explanation: `From the unit circle: \\(\\sin(${deg}°) = ${correct}\\).`,
      difficulty: "easy", topic: "Trigonometry Basics", subtopic: "trigonometry-basics",
    };
  },
  intermediate: (seed, idx) => {
    const rng = mulberry32(seed);
    const opp = randInt(seed, 3, 6);
    const adj = randInt(seed + 1, 4, 8);
    const tan = (opp / adj).toFixed(2);
    const correct = tan;
    const wrongs = [(adj / opp).toFixed(2), (opp * adj).toFixed(2), (Math.sqrt(opp * opp + adj * adj) / adj).toFixed(2)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `In a right triangle, the opposite side is \\(${opp}\\) and the adjacent side is \\(${adj}\\). Find \\(\\tan\\theta\\).`, options, correctIndex,
      explanation: `\\(\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}} = \\frac{${opp}}{${adj}} \\approx ${correct}\\).`,
      difficulty: "medium", topic: "Trigonometry Basics", subtopic: "trigonometry-basics",
    };
  },
  advanced: (seed, idx) => {
    const rng = mulberry32(seed);
    const deg = randInt(seed, 30, 60);
    const rad = (deg * Math.PI / 180).toFixed(2);
    const correct = rad;
    const wrongs = [(deg * 180 / Math.PI).toFixed(2), (deg / 180).toFixed(2), String(deg * 2)];
    const { options, correctIndex } = buildOptions(correct, wrongs, rng);
    return {
      id: idx, question: `Convert \\(${deg}°\\) to radians.`, options, correctIndex,
      explanation: `Multiply by \\(\\frac{\\pi}{180}\\): \\(${deg}° \\times \\frac{\\pi}{180} = \\frac{${deg}\\pi}{180} \\approx ${correct}\\) radians.`,
      difficulty: "hard", topic: "Trigonometry Basics", subtopic: "trigonometry-basics",
    };
  },
};

export const generators: Record<string, Record<Depth, GenFn>> = {
  "points-lines-planes": pointsLinesPlanes,
  "angles": angles,
  "triangles": triangles,
  "circles": circles,
  "polygons": polygons,
  "transformations": transformations,
  "coordinate-geometry": coordinateGeometry,
  "trigonometry-basics": trigonometryBasics,
};
