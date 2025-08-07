import React, { useState } from 'react';

const QuizitTab = ({ formData, handleInputChange, handleGenerate }) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [confirmedTests, setConfirmedTests] = useState([]);
  const [testStates, setTestStates] = useState({
    0: { isTested: false, isConfirmed: false },
    1: { isTested: false, isConfirmed: false },
    2: { isTested: false, isConfirmed: false },
    3: { isTested: false, isConfirmed: false },
    4: { isTested: false, isConfirmed: false }
  });

  const handleTestClick = (index) => {
    setTestStates(prev => ({
      ...prev,
      [index]: { ...prev[index], isTested: true }
    }));
  };

  const handleConfirmTest = (index) => {
    setConfirmedTests(prev => [...prev, index]);
    setTestStates(prev => ({
      ...prev,
      [index]: { ...prev[index], isConfirmed: true }
    }));
  };

  const getTestStatus = (index) => {
    const test = testStates[index];
    if (test.isConfirmed) return 'confirmed';
    if (test.isTested) return 'tested';
    return 'untested';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'tested':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'untested':
        return 'bg-gray-100 text-gray-400 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return '✓ Confirmed';
      case 'tested':
        return 'Tested';
      case 'untested':
        return '';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Prompt Input Section */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="font-medium text-lg">Prompt</label>
          <button
            onClick={() => handleGenerate('prompt')}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm flex items-center space-x-1"
          >
            <span>Prompt</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
        <textarea
          value={(formData?.prompt) || ''}
          onChange={(e) => handleInputChange('prompt', e.target.value)}
          className="w-full p-4 border border-gray-300 rounded h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your quiz prompt here..."
        />
      </div>

      {/* Current Test Section */}
      <div className="bg-white rounded-lg p-6">
        {/* Test Navigation */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[0, 1, 2, 3, 4].map((index) => {
            const status = getTestStatus(index);
            const isActive = currentTestIndex === index;
            return (
              <button
                key={index}
                onClick={() => setCurrentTestIndex(index)}
                className={`h-12 rounded-lg flex flex-col items-center justify-center text-xs font-medium border-2 transition-all duration-200 ${
                  isActive 
                    ? 'ring-2 ring-blue-500 ring-offset-1' 
                    : 'hover:shadow-md'
                } ${getStatusColor(status)}`}
              >
                <span className="font-bold">Test {index + 1}</span>
                <span className="text-xs mt-0.5">{getStatusText(status)}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-end mb-4">
          <span className={`text-sm px-2 py-1 rounded ${getStatusColor(getTestStatus(currentTestIndex))}`}>
            {getStatusText(getTestStatus(currentTestIndex))}
          </span>
        </div>

        <div className="space-y-4">
          {/* Quizit Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Generated Quizit</h4>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px]">
              {testStates[currentTestIndex]?.isTested 
                ? `Sample quizit content for test ${currentTestIndex + 1}...`
                : 'Click "Test" to generate quizit content...'
              }
            </div>
          </div>

          {/* Reasoning Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Reasoning</h4>
            <div className="bg-white border border-gray-200 rounded p-3 text-sm min-h-[80px]">
              {testStates[currentTestIndex]?.isTested 
                ? `Sample reasoning for test ${currentTestIndex + 1}...`
                : 'Click "Test" to generate reasoning...'
              }
            </div>
          </div>

          {/* Feedback Field */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Feedback</h4>
            <textarea
              className="w-full p-3 border border-gray-200 rounded text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide feedback on this test result. This feedback will be used when generating a new prompt alongside the quizit and reasoning output..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            {!testStates[currentTestIndex]?.isTested ? (
              <button
                onClick={() => handleTestClick(currentTestIndex)}
                disabled={!formData?.prompt}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Test
              </button>
            ) : !testStates[currentTestIndex]?.isConfirmed ? (
              <button
                onClick={() => handleConfirmTest(currentTestIndex)}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
              >
                Confirm
              </button>
            ) : (
              <span className="text-green-600 font-medium px-6 py-2">
                ✓ Confirmed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      {confirmedTests.length > 0 && (
        <div className="bg-white rounded-lg p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-lg">Summary</h3>
            <span className="text-sm text-green-600 font-medium">
              {confirmedTests.length} of 5 tests confirmed
            </span>
          </div>
          
          <div className="grid grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((index) => {
              const status = getTestStatus(index);
              return (
                <div
                  key={index}
                  className={`h-12 rounded-lg flex items-center justify-center text-xs font-medium border-2 ${getStatusColor(status)}`}
                >
                  {getStatusText(status)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizitTab; 