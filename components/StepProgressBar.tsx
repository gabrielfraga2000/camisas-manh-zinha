import React from 'react';

const StepProgressBar = ({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) => (
  <div className="flex items-center justify-between mb-8 w-full max-w-md mx-auto">
    {[1, 2, 3].map((s) => (
      <div key={s} className="flex items-center flex-1 last:flex-none">
        <button 
          onClick={() => onStepClick(s)}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 hover:scale-110 active:scale-95 ${
            currentStep >= s ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {s}
        </button>
        {s < 3 && (
          <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${
            currentStep > s ? 'bg-orange-300' : 'bg-gray-200'
          }`} />
        )}
      </div>
    ))}
  </div>
);

export default StepProgressBar;
