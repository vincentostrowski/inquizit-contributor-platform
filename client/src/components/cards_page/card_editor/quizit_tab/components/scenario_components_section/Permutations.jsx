import { generateValidOrderings } from '../../../../../../utils/dependencyUtils';

const Permutations = ({ components, selectedPermutations, onPermutationsChange }) => {
    const handlePermutationSelect = (permutation) => {
        const newSelected = [...selectedPermutations]; // Copy current array
        
        if (newSelected.includes(permutation)) {
            // Remove if already selected
            const index = newSelected.indexOf(permutation);
            newSelected.splice(index, 1);
        } else if (newSelected.length < 3) {
            // Add if under limit
            newSelected.push(permutation);
        }
        
        onPermutationsChange(newSelected);
    };

    // Filter to only scenario components for permutation generation
    const scenarioComponents = components.filter(comp => comp.type === 'scenario');
    // Show up to 10 diverse permutations for selection, but user can only select 3
    const { validOrderings, error } = generateValidOrderings(scenarioComponents, 10);

    // If no valid orderings, show message
    if (error) {
        return (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="text-xs text-red-600 mb-2 font-medium">Error:</div>
                <div className="text-xs text-red-600">{error}</div>
            </div>
        );
    }

    if (!validOrderings || validOrderings.length === 0) {
        return (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-xs text-gray-600 font-medium mb-2">Valid Orderings:</div>
                <div className="text-xs text-gray-500 italic">
                    No valid orderings found. Check your dependencies.
                </div>
            </div>
        );
    }

    // Ensure we have an array for display logic
    const safeSelectedPermutations = Array.isArray(selectedPermutations) ? selectedPermutations : [];

    return (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded">
            <div className="text-xs text-gray-600 font-medium mb-2">Valid Orderings:</div>
            <div className="text-xs text-gray-500 mb-2">
              Showing {validOrderings.length} diverse permutations. Select up to 3 ({safeSelectedPermutations.length}/3 selected)
            </div>
            <div className="flex flex-wrap gap-1">
                {validOrderings.map((permutation, index) => {
                    const isSelected = safeSelectedPermutations.includes(permutation);
                    const canSelect = safeSelectedPermutations.includes(permutation) || safeSelectedPermutations.length < 3;
                    
                    return (
                        <button
                            key={index}
                            onClick={() => handlePermutationSelect(permutation)}
                            disabled={!canSelect}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-mono border transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                                    : canSelect
                                    ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                    : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                            title={`Selected: ${isSelected}, Can Select: ${canSelect}, Total Selected: ${safeSelectedPermutations.length}`}
                        >
                            {permutation}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default Permutations;