import React from 'react';

const BookingStepper = ({ currentStep }) => {
  const steps = [
    { number: '01', label: 'CHỌN SUẤT CHIẾU' },
    { number: '02', label: 'CHỌN GHẾ' },
    { number: '03', label: 'THANH TOÁN' }
  ];

  return (
    <div className="w-full bg-white dark:bg-[#050505]/90 border-b border-gray-200/80 dark:border-white/10 py-5 transition-colors duration-300 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 md:px-16 flex items-center justify-center">
        <div className="flex items-center w-full max-w-xl justify-between relative">
          
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200 dark:bg-white/15 -z-0"></div>
          
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-[#E50914] to-[#7B61FF] transition-all duration-500 -z-0 shadow-[0_0_12px_rgba(229,9,20,0.5)]"
            style={{ 
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : 'calc(100% - 32px)' 
            }}
          ></div>

          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <div key={idx} className="flex flex-col items-center relative z-10 bg-white dark:bg-[#050505] px-3.5 transition-colors duration-300">
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 border-2 ${
                    isActive 
                      ? 'bg-[#E50914] border-[#E50914] text-white shadow-md shadow-red-500/40 scale-110 dark:shadow-[0_0_20px_rgba(229,9,20,0.55)]' 
                      : isCompleted
                        ? 'bg-gray-900 dark:bg-gradient-to-br dark:from-[#4CC9F0] dark:to-[#7B61FF] border-gray-900 dark:border-transparent text-white dark:text-[#050505]'
                        : 'bg-white dark:bg-white/5 border-gray-300 dark:border-white/15 text-gray-400 dark:text-white/35'
                  }`}
                >
                  {step.number}
                </div>
                <span 
                  className={`text-[9px] font-black tracking-widest mt-2 transition-colors duration-300 ${
                    isActive 
                      ? 'text-[#E50914]' 
                      : isCompleted
                        ? 'text-gray-800 dark:text-white/80'
                        : 'text-gray-400 dark:text-white/35'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
};

export default BookingStepper;
