import React from 'react';

const QuizitConfigurationHeader = ({
  fieldCompletion,
  onFieldCompletionToggle,
  tests,
  onResetQuizitData,
  hasOriginalData
}) => {
  const totalConfirmed = Object.values(tests).filter(test => test.confirmed).length;
  const totalTests = Object.keys(tests).length;
  const completionPercentage = (totalConfirmed / totalTests) * 100;
  const isCompleted = completionPercentage === 100;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-2">
        <label className="font-medium text-lg">Configuration</label>
        {/* Completion toggle for quizit configuration */}
        <button
          onClick={() => {
            if (onFieldCompletionToggle) {
              onFieldCompletionToggle('quizit_configuration', !fieldCompletion?.quizit_configuration);
            }
          }}
          disabled={!isCompleted}
          className={`w-4 h-4 rounded border-2 transition-colors ${
            fieldCompletion?.quizit_configuration
              ? 'bg-green-500 border-green-500'
              : 'bg-white border-gray-300 hover:border-gray-400'
          } hover:border-gray-400`}
          title={
            fieldCompletion?.quizit_configuration ? 'Mark quizit configuration as incomplete' : 'Mark quizit configuration as complete'
          }
        >
          {fieldCompletion?.quizit_configuration && (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {totalConfirmed} / {totalTests} confirmed
        </span>
      </div>
      
      {/* Reset button */}
      {hasOriginalData && (
        <button
          onClick={onResetQuizitData}
          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors flex items-center space-x-1"
          title="Reset quizit data to saved state"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset to Saved</span>
        </button>
      )}
    </div>
  );
};

export default QuizitConfigurationHeader;
