import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface OnboardingData {
  // Шаг 1: Персональные данные
  name: string;
  age: number | null;
  gender: string;
  
  // Шаг 2: Доход
  monthly_income: number | null;
  income_source: string;
  income_stability: number | null;
  
  // Шаг 3: Расходы
  monthly_expenses: number | null;
  spending_categories: string[];
  
  // Шаг 4: Цели
  goals: string[];
  
  // Шаг 5: Финансовая психология
  financial_confidence: number | null;
  spending_impulsiveness: number | null;
  financial_stress: number | null;
  saving_frequency: string;
  
  // Шаг 6: Привычки
  tracks_expenses: boolean;
  used_financial_apps: string;
  wants_motivation: boolean;
}

type OnboardingAction =
  | { type: 'UPDATE_STEP_1'; payload: { name: string; age: number | null; gender: string } }
  | { type: 'UPDATE_STEP_2'; payload: { monthly_income: number | null; income_source: string; income_stability: number | null } }
  | { type: 'UPDATE_STEP_3'; payload: { monthly_expenses: number | null; spending_categories: string[] } }
  | { type: 'UPDATE_STEP_4'; payload: { goals: string[] } }
  | { type: 'UPDATE_STEP_5'; payload: { financial_confidence: number | null; spending_impulsiveness: number | null; financial_stress: number | null; saving_frequency: string } }
  | { type: 'UPDATE_STEP_6'; payload: { tracks_expenses: boolean; used_financial_apps: string; wants_motivation: boolean } }
  | { type: 'RESET' };

const initialState: OnboardingData = {
  name: '',
  age: null,
  gender: '',
  monthly_income: null,
  income_source: '',
  income_stability: null,
  monthly_expenses: null,
  spending_categories: [],
  goals: [],
  financial_confidence: null,
  spending_impulsiveness: null,
  financial_stress: null,
  saving_frequency: '',
  tracks_expenses: false,
  used_financial_apps: '',
  wants_motivation: false,
};

function onboardingReducer(state: OnboardingData, action: OnboardingAction): OnboardingData {
  switch (action.type) {
    case 'UPDATE_STEP_1':
      return { ...state, ...action.payload };
    case 'UPDATE_STEP_2':
      return { ...state, ...action.payload };
    case 'UPDATE_STEP_3':
      return { ...state, ...action.payload };
    case 'UPDATE_STEP_4':
      return { ...state, ...action.payload };
    case 'UPDATE_STEP_5':
      return { ...state, ...action.payload };
    case 'UPDATE_STEP_6':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface OnboardingContextType {
  state: OnboardingData;
  dispatch: React.Dispatch<OnboardingAction>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(onboardingReducer, initialState);

  return (
    <OnboardingContext.Provider value={{ state, dispatch }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 