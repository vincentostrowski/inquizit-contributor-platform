import ThemeInjectionsSection from './quizit_tab/components/ThemeInjectionsSection';
import QuizitConfigurationHeader from './quizit_tab/components/QuizitConfigurationHeader';
import WordsToAvoidSection from './quizit_tab/components/WordsToAvoidSection';
import QuizitComponentsSection from './quizit_tab/components/QuizitComponentsSection';
import TestSection from './quizit_tab/components/TestSection';

const QuizitTab = ({ formData, fieldCompletion, onFieldCompletionToggle, selectedPermutations, setSelectedPermutations, componentStructure, setComponentStructure, wordsToAvoid, setWordsToAvoid, themeInjections, setThemeInjections, tests, setTests, clearAndMapTests, onResetQuizitData, hasOriginalData }) => {

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Quizit Components Section */}
      <div className="bg-white rounded-lg p-6 mb-6">
        <QuizitConfigurationHeader
          fieldCompletion={fieldCompletion}
          onFieldCompletionToggle={onFieldCompletionToggle}
          tests={tests}
          onResetQuizitData={onResetQuizitData}
          hasOriginalData={hasOriginalData}
        />
        
        {/* Quizit Components Field */}
        <QuizitComponentsSection
          formData={formData}
          componentStructure={componentStructure}
          onComponentStructureChange={setComponentStructure}
          selectedPermutations={selectedPermutations}
          onPermutationsChange={setSelectedPermutations}
          clearAndMapTests={clearAndMapTests}
        />

        <WordsToAvoidSection
          formData={formData}
          wordsToAvoid={wordsToAvoid}
          setWordsToAvoid={setWordsToAvoid}
          clearAndMapTests={clearAndMapTests}
        />

        <ThemeInjectionsSection
          formData={formData}
          themeInjections={themeInjections}
          setThemeInjections={setThemeInjections}
          clearAndMapTests={clearAndMapTests}
        />
      </div>

      {/* Current Test Section */}
      <TestSection
        formData={formData}
        componentStructure={componentStructure}
        selectedPermutations={selectedPermutations}
        themeInjections={themeInjections}
        wordsToAvoid={wordsToAvoid}
        tests={tests}
        setTests={setTests}
        clearAndMapTests={clearAndMapTests}
      />
    </div>
  );
};

export default QuizitTab; 