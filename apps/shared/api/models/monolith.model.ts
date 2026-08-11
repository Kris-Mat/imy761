export interface AnswerOption {
  id: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export type QuestionCategory =
  'DIAGNOSTIC_HORIZONS' | 'SOIL_FORM' | 'SOIL_FAMILY_CODE' | 'LANDSCAPE_POSITION' | 'SUITABILITY';

export interface Question {
  id: number;
  category: QuestionCategory;
  orderIndex: number;
  prompt: string;
  options: AnswerOption[];
}

export interface HorizonCharacteristic {
  id: number;
  text: string;
  orderIndex: number;
}

export interface Horizon {
  id: number;
  label: string;
  orderIndex: number;
  colourText: string;
  colourHue: string;
  colourValue: number;
  colourChroma: number;
  characteristics: HorizonCharacteristic[];
}

export interface SoilFamilyField {
  id: number;
  label: string;
  correctValue: string;
  orderIndex: number;
}

export interface SoilFamilyCode {
  id: number;
  finalCode: string;
  soilFamilyName: string;
  fields: SoilFamilyField[];
}

export interface Monolith {
  id: number;
  name: string;
  imageUrl: string;
  finalSoilForm: string;
  orderIndex: number;
  horizons: Horizon[];
  questions: Question[];
  soilFamilyCode: SoilFamilyCode | null;
}
