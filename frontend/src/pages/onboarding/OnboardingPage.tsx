import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, OnboardingProvider } from '../../context/OnboardingContext';
import { useAuth } from '../../AuthContext';
import { StepCardWrapper } from '../../components/onboarding/StepCardWrapper';
import { Step1Personal } from '../../components/onboarding/Step1Personal';
import { Step2Income } from '../../components/onboarding/Step2Income';
import { Step3Expenses } from '../../components/onboarding/Step3Expenses';
import { Step4Goals } from '../../components/onboarding/Step4Goals';
import { Step5Psychology } from '../../components/onboarding/Step5Psychology';
import { Step6Habits } from '../../components/onboarding/Step6Habits';
import { Header } from '../../components/ui/Header';
import api from '../../api';

const OnboardingContent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { state } = useOnboarding();
  const navigate = useNavigate();
  const auth = useAuth();

  const totalSteps = 6;

  const steps = [
    {
      component: Step1Personal,
      title: 'Расскажите о себе',
      subtitle: 'Помогите нам лучше понять вас',
    },
    {
      component: Step2Income,
      title: 'Ваш доход',
      subtitle: 'Расскажите о ваших источниках дохода',
    },
    {
      component: Step3Expenses,
      title: 'Ваши расходы',
      subtitle: 'Какие траты у вас самые частые?',
    },
    {
      component: Step4Goals,
      title: 'Финансовые цели',
      subtitle: 'К чему вы стремитесь?',
    },
    {
      component: Step5Psychology,
      title: 'Финансовая психология',
      subtitle: 'Как вы относитесь к деньгам?',
    },
    {
      component: Step6Habits,
      title: 'Ваши привычки',
      subtitle: 'Последний шаг к персонализации',
    },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/onboarding/', state);
      auth.updateProfileStatus(true);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      // Можно добавить обработку ошибок
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return state.name.trim() !== '' && state.age !== null && state.gender !== '';
      case 2:
        return state.monthly_income !== null && state.income_source !== '' && state.income_stability !== null;
      case 3:
        return state.monthly_expenses !== null && state.spending_categories.length > 0;
      case 4:
        return state.goals.length > 0;
      case 5:
        return state.financial_confidence !== null && state.spending_impulsiveness !== null && 
               state.financial_stress !== null && state.saving_frequency !== '';
      case 6:
        return state.used_financial_apps !== '';
      default:
        return false;
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <Header title="Настройка профиля" showUserInfo={false} />
      <div className="flex items-center justify-center px-4 py-8">
        <StepCardWrapper
          title={steps[currentStep - 1].title}
          subtitle={steps[currentStep - 1].subtitle}
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={handleNext}
          onBack={handleBack}
          canGoNext={canGoNext() && !isSubmitting}
          isLastStep={currentStep === totalSteps}
        >
          <CurrentStepComponent />
        </StepCardWrapper>
      </div>
    </div>
  );
};

const OnboardingPage: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default OnboardingPage; 