import { getNextQuestion, getQuestions } from '../../game/data/questions';
import type { Question } from '../../types';

export { getQuestions };

/** Prefer text MCQs in 3D — image question assets are not bundled yet. */
export const getNextTextQuestion = (): Question => {
  for (let i = 0; i < 40; i++) {
    const q = getNextQuestion();
    if (q.category !== 'image' && !q.options.some((o) => o.image)) {
      return q;
    }
  }
  return getNextQuestion();
};

export { getNextQuestion };
