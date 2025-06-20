import React from 'react';

interface StepCardWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  canGoNext: boolean;
  isLastStep?: boolean;
}

export const StepCardWrapper: React.FC<StepCardWrapperProps> = ({
  children,
  title,
  subtitle = "Это поможет нам лучше понять ваш финансовый стиль 💡",
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canGoNext,
  isLastStep = false,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              Шаг {currentStep} из {totalSteps}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Content */}
          <div className="mb-8">
            {children}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Назад
            </button>

            <button
              onClick={onNext}
              disabled={!canGoNext}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                canGoNext
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLastStep ? 'Завершить' : 'Далее'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 