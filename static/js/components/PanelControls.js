import { RangeSelectors } from "./RangeSelectors";
import { ColorSelectors } from "./ColorSelectors";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { DimensionInputs } from "./DimensionsInputs";

function PanelControl({
  gradientValues,
  handleChange,
  colorChange,
  changeNumber,
  setShowDownload,
  gradientStyles,
  warpShapes,
  addColor,
  toggleUploadPanel,
  regeneratePositions,
  exportP5Code,
}) {
  const {
    warpRatio,
    warpSize,
    noiseRatio,
    bgColor,
    colors,
    numberPoints,
    randomNumber,
    gradientTypeIndex,
    warpShapeIndex,
  } = gradientValues;

  return (
    <div className="panel">
      <div className="gradient-type">
        <div className="heading-wrapper gradient-heading">
          <h3 className="label">Gradient</h3>
          <div className="gradient-type-selector">
            <Select.Root
              value={gradientTypeIndex.toString()}
              onValueChange={(value) =>
                handleChange({
                  target: {
                    name: "gradientTypeIndex",
                    value: parseInt(value, 10),
                  },
                })
              }
            >
              <Select.Trigger
                className="SelectTrigger"
                aria-label="Gradient Style"
              >
                <Select.Value placeholder="Select a gradient style…" />
                <Select.Icon className="SelectIcon">
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="SelectContent">
                  <Select.Viewport className="SelectViewport">
                    {gradientStyles.map((style) => (
                      <Select.Item
                        key={style.id}
                        value={style.id.toString()}
                        className="SelectItem"
                      >
                        <Select.ItemText>{style.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>
      <div className="warp-shape">
        <div className="heading-wrapper warp-heading">
          <h3 className="label">Warp Shape</h3>
          <div className="warp-shape-selector">
            <Select.Root
              value={warpShapeIndex.toString()}
              onValueChange={(value) =>
                handleChange({
                  target: {
                    name: "warpShapeIndex",
                    value: parseInt(value, 10),
                  },
                })
              }
            >
              <Select.Trigger className="SelectTrigger" aria-label="Warp Shape">
                <Select.Value placeholder="Select a warp shape…" />
                <Select.Icon className="SelectIcon">
                  <ChevronDownIcon />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="SelectContent">
                  <Select.Viewport className="SelectViewport">
                    {warpShapes.map((shape) => (
                      <Select.Item
                        key={shape.id}
                        value={shape.id.toString()}
                        className="SelectItem"
                      >
                        <Select.ItemText>{shape.name}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        </div>
      </div>
      <DimensionInputs
        gradientValues={gradientValues}
        handleChange={handleChange}
      />
      <RangeSelectors
        handleChange={handleChange}
        warpRatio={warpRatio}
        warpSize={warpSize}
        noiseRatio={noiseRatio}
      />
      <ColorSelectors
        handleChange={handleChange}
        addColor={addColor}
        colorChange={colorChange}
        changeNumber={changeNumber}
        bgColor={bgColor}
        numberPoints={numberPoints}
        colors={colors}
        randomNumber={randomNumber}
        toggleUploadPanel={toggleUploadPanel}
        regeneratePositions={regeneratePositions}
      />
      <div className="panel-footer">
        <div className="download-button" onClick={setShowDownload}>
          <div className="button-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6.5 15.5V16.5C6.5 17.0523 6.94772 17.5 7.5 17.5H16.5C17.0523 17.5 17.5 17.0523 17.5 16.5V15.5M12 5.5V13.5M12 13.5L9 10.5M12 13.5L15 10.5"
                stroke="black"
                strokeOpacity="0.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="button-label">Download</span>
        </div>
        {/* <div className="download-button" onClick={exportP5Code}>
          <div className="button-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 14V18H4V14H2V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V14H20ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="black"/>
            </svg>
          </div>
          <span className="button-label">Export</span>
        </div> */}
      </div>
    </div>
  );
}

export default PanelControl;
