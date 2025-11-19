export type Language = 'es' | 'eu';

export enum UserRole {
  TEACHER = 'Docente',
  STUDENT = 'Alumnado',
  BOTH = 'Ambos'
}

export enum AppCategory {
  GAMIFICATION = 'Gamificación',
  CONTENT_CREATION = 'Creación de Contenido',
  MANAGEMENT = 'Gestión',
  ASSESSMENT = 'Evaluación',
  COLLABORATION = 'Colaboración',
  OTHER = 'Otros'
}

export enum EducationStage {
  INFANTIL = 'Infantil',
  PRIMARIA = 'Primaria',
  SECUNDARIA = 'Secundaria',
  BACHILLERATO = 'Bachillerato',
  FP = 'FP',
  UNIVERSIDAD = 'Universidad'
}

export interface LocalizedText {
  es: string;
  eu: string;
}

export interface LocalizedList {
  es: string[];
  eu: string[];
}

export interface EduApp {
  id: string;
  name: string;
  description: LocalizedText;
  category: AppCategory;
  targetAudience: UserRole;
  stages: EducationStage[];
  priceModel: 'Gratis' | 'Freemium' | 'Pago';
  website: string;
  iconUrl: string;
  features: LocalizedList;
  minAge: number | null; // New field for minimum age
}

export interface AIPrivacyAnalysis {
  gdprCompliant: boolean;
  dataCollected: string;
  ageWarning: string;
  complianceSummary: string;
}

export interface AIReview {
  summary: string;
  teacherTip: string;
  studentActivity: string;
  pros: string[];
  cons: string[];
  privacy: AIPrivacyAnalysis; // New field for privacy analysis
}