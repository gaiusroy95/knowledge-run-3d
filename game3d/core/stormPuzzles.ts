import type { ActivePuzzle } from '../../types';

const pickOne = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function buildStormPuzzleSequence(): ActivePuzzle[] {
  const oneLineShapes: ActivePuzzle[] = [
    {
      id: 'storm_line_star',
      type: 'STORM',
      mode: 'ONE_LINE',
      prompt: 'ارسم النجمة بخط واحد متصل.',
      timeoutMs: 12000,
      shapeId: 'star',
      points: [
        { x: 0.5, y: 0.08 },
        { x: 0.62, y: 0.38 },
        { x: 0.92, y: 0.38 },
        { x: 0.68, y: 0.58 },
        { x: 0.76, y: 0.9 },
        { x: 0.5, y: 0.7 },
        { x: 0.24, y: 0.9 },
        { x: 0.32, y: 0.58 },
        { x: 0.08, y: 0.38 },
        { x: 0.38, y: 0.38 },
        { x: 0.5, y: 0.08 },
      ],
    },
    {
      id: 'storm_line_square_diag',
      type: 'STORM',
      mode: 'ONE_LINE',
      prompt: 'ارسم المربع مع القطر بخط واحد.',
      timeoutMs: 12000,
      shapeId: 'square_diag',
      points: [
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.2, y: 0.8 },
        { x: 0.2, y: 0.2 },
        { x: 0.8, y: 0.8 },
      ],
    },
    {
      id: 'storm_line_triangle_inner',
      type: 'STORM',
      mode: 'ONE_LINE',
      prompt: 'ارسم المثلث مع الخط الداخلي بخط واحد.',
      timeoutMs: 12000,
      shapeId: 'triangle_inner',
      points: [
        { x: 0.5, y: 0.12 },
        { x: 0.82, y: 0.8 },
        { x: 0.18, y: 0.8 },
        { x: 0.5, y: 0.12 },
        { x: 0.3, y: 0.5 },
        { x: 0.7, y: 0.5 },
      ],
    },
  ];
  const memoryPool: ActivePuzzle[] = [
    {
      id: 'storm_mem_1',
      type: 'STORM',
      mode: 'MEMORY',
      prompt: 'تذكر ترتيب الرموز ثم اختره بنفس الترتيب.',
      timeoutMs: 12000,
      sequence: ['⭐️', '📘', '🗝️', '🌙'],
      showMs: 2000,
    },
    {
      id: 'storm_mem_2',
      type: 'STORM',
      mode: 'MEMORY',
      prompt: 'تذكر ترتيب الرموز ثم اختره بنفس الترتيب.',
      timeoutMs: 12000,
      sequence: ['🌙', '⭐️', '📜', '🔑'],
      showMs: 2000,
    },
    {
      id: 'storm_mem_3',
      type: 'STORM',
      mode: 'MEMORY',
      prompt: 'تذكر ترتيب الرموز ثم اختره بنفس الترتيب.',
      timeoutMs: 12000,
      sequence: ['📚', '🕯️', '🗝️', '⭐️'],
      showMs: 2000,
    },
  ];
  const matchPool: ActivePuzzle[] = [
    {
      id: 'storm_match_1',
      type: 'STORM',
      mode: 'MATCH',
      prompt: 'صِل كل عنصر بما يناسبه ثم اضغط تحقق.',
      timeoutMs: 15000,
      leftItems: ['كتاب', 'قمر', 'شمس', 'مفتاح'],
      rightItems: ['ليل', 'باب', 'معرفة', 'نهار'],
      pairs: [
        { leftIndex: 0, rightIndex: 2 },
        { leftIndex: 1, rightIndex: 0 },
        { leftIndex: 2, rightIndex: 3 },
        { leftIndex: 3, rightIndex: 1 },
      ],
    },
    {
      id: 'storm_match_2',
      type: 'STORM',
      mode: 'MATCH',
      prompt: 'صِل كل عنصر بما يناسبه ثم اضغط تحقق.',
      timeoutMs: 15000,
      leftItems: ['مخطوطة', 'مصباح', 'نجمة', 'كتاب'],
      rightItems: ['سماء', 'حكمة', 'تعلم', 'ضوء'],
      pairs: [
        { leftIndex: 0, rightIndex: 2 },
        { leftIndex: 1, rightIndex: 3 },
        { leftIndex: 2, rightIndex: 0 },
        { leftIndex: 3, rightIndex: 1 },
      ],
    },
  ];

  const sequence: ActivePuzzle[] = [];
  sequence.push(pickOne(oneLineShapes));
  sequence.push(pickOne(memoryPool));
  sequence.push(pickOne(matchPool));

  const mixed = [...oneLineShapes, ...memoryPool, ...matchPool];
  while (sequence.length < 5) {
    const candidate = pickOne(mixed);
    const prev = sequence[sequence.length - 1];
    if (prev && prev.id === candidate.id) continue;
    sequence.push(candidate);
  }

  return sequence.map((p, idx) => ({ ...p, id: `${p.id}_${idx}_${Date.now()}` }));
}

export function createStormPuzzleQueue(): ActivePuzzle[] {
  return buildStormPuzzleSequence();
}
