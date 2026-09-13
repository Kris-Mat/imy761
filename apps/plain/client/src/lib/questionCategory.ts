import type { Question, QuestionCategory } from '@shared/api/models/monolith.model';

export const categoryLabels: Record<QuestionCategory, string> = {
  DIAGNOSTIC_HORIZONS: 'Diagnostic Horizons',
  SOIL_FORM: 'Soil Form',
  SOIL_FAMILY_CODE: 'Soil Family Code',
  LANDSCAPE_POSITION: 'Landscape Position',
  SUITABILITY: 'Suitability'
};

// A category label alone stops being unique once a monolith has more than
// one question in that category (e.g. 4 SOIL_FAMILY_CODE digit questions),
// so every question needing a nav-list label gets keyed here: unchanged if
// its category is unique within `questions`, otherwise suffixed with its
// rank among same-category questions — "(N of M)", N taken from their order
// in `questions` (the API already returns monolith.questions sorted by
// orderIndex, so this is the same as ranking by orderIndex within the
// category). Generic over however many questions any category has, so a
// future phase adding more doesn't need this touched again.
export function questionNavLabels(questions: Question[]): Map<number, string> {
  const totalByCategory = new Map<QuestionCategory, number>();
  for (const question of questions) {
    totalByCategory.set(question.category, (totalByCategory.get(question.category) ?? 0) + 1);
  }

  const seenByCategory = new Map<QuestionCategory, number>();
  const labels = new Map<number, string>();
  for (const question of questions) {
    const total = totalByCategory.get(question.category)!;
    const label = categoryLabels[question.category];
    if (total <= 1) {
      labels.set(question.id, label);
      continue;
    }
    const position = (seenByCategory.get(question.category) ?? 0) + 1;
    seenByCategory.set(question.category, position);
    labels.set(question.id, `${label} (${position} of ${total})`);
  }
  return labels;
}
