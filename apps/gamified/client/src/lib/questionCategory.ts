import type { QuestionCategory } from '@shared/api/models/monolith.model';

export const categoryLabels: Record<QuestionCategory, string> = {
  DIAGNOSTIC_HORIZONS: 'Diagnostic Horizons',
  SOIL_FORM: 'Soil Form',
  SOIL_FAMILY_CODE: 'Soil Family Code',
  LANDSCAPE_POSITION: 'Landscape Position',
  SUITABILITY: 'Suitability'
};
