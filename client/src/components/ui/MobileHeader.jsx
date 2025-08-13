const MobileHeader = ({ onBack, headerColor, buttonTextBorderColor, buttonCircleColor }) => {
  // Function to determine if a color is light or dark
  const getContrastColor = (hexColor) => {
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance (brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };
    return (
<div 
  className="HEADER p-2 flex-shrink-0"
  style={{ backgroundColor: headerColor }}
>
<div className="flex items-center gap-2">
  {/* Back Button */}
  <button 
    onClick={onBack}
    className="flex items-center justify-center opacity-50"
    style={{ borderColor: buttonTextBorderColor }}
  >
    <svg 
      className="w-5 h-5" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      style={{ 
        stroke: getContrastColor(headerColor) 
      }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  </button>
  
  {/* Action Buttons */}
  <div className="flex gap-3 flex-1 justify-center">
    {/* Start Quizit Session */}
          <div 
        className="flex items-center border rounded-full p-1 pr-4"
        style={{ borderColor: buttonTextBorderColor }}
      >
              <div 
          className="w-8 h-8 rounded-full flex items-center justify-center mr-1"
          style={{ backgroundColor: buttonCircleColor }}
        >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: headerColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <span 
        className="text-[10px] text-left"
        style={{ color: buttonTextBorderColor }}
      >Start Quizit<br />Session</span>
    </div>
    
    {/* Check for Conflicts */}
    <div 
      className="flex items-center border rounded-full p-1 pr-4 opacity-50"
      style={{ borderColor: buttonTextBorderColor }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mr-1"
        style={{ backgroundColor: buttonCircleColor }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: headerColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <span 
        className="text-[10px] text-left"
        style={{ color: buttonTextBorderColor }}
      >Check for<br />Conflicts</span>
    </div>
    
    {/* View Past Quizits */}
    <div 
      className="flex items-center border rounded-full p-1 pr-4 opacity-50"
      style={{ borderColor: buttonTextBorderColor }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center mr-1"
        style={{ backgroundColor: buttonCircleColor }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ stroke: headerColor }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      <span 
        className="text-[10px] text-left"
        style={{ color: buttonTextBorderColor }}
      >View Past<br />Quizits</span>
    </div>
  </div>
</div>
</div>
)
}

export default MobileHeader;