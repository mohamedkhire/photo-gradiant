// DimensionInputs.jsx
const DimensionInputs = ({ gradientValues, handleChange }) => {
  return (
    <div className="dimensions-container">
      <div className="dimension-inputs">
        <div className="dimension-input">
          <span className="dimension-label">W</span>
          <input
            type="number"
            name="customWidth"
            value={gradientValues.customWidth}
            onChange={handleChange}
            min="1"
            className="dimension-field"
          />
        </div>

        <div className="dimension-input">
          <span className="dimension-label">H</span>
          <input
            type="number"
            name="customHeight"
            value={gradientValues.customHeight}
            onChange={handleChange}
            min="1"
            className="dimension-field"
          />
        </div>
      </div>
    </div>
  );
};

export { DimensionInputs };
