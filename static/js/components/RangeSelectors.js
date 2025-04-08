import * as Slider from "@radix-ui/react-slider";

export function RangeSelectors(props) {
  return (
    <div className="ranges-container">
      <div className="range-wrapper">
        <h3 className="slider-label">Warp</h3>
        <div className="range">
          <Slider.Root
            className="SliderRoot"
            name="warpRatio"
            id="warpRatio"
            value={[props.warpRatio]}
            min={0}
            max={1.5}
            step={0.01}
            onValueChange={(value) =>
              props.handleChange({
                target: { name: "warpRatio", value: value[0] },
              })
            }
          >
            <Slider.Track className="SliderTrack">
              <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" />
          </Slider.Root>
        </div>
      </div>
      <div className="range-wrapper">
        <h3 className="slider-label">Warp Size</h3>
        <div className="range">
          <Slider.Root
            className="SliderRoot"
            name="warpSize"
            id="warpSize"
            value={[props.warpSize]}
            min={0}
            max={3}
            step={0.01}
            onValueChange={(value) =>
              props.handleChange({
                target: { name: "warpSize", value: value[0] },
              })
            }
          >
            <Slider.Track className="SliderTrack">
              <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" />
          </Slider.Root>
        </div>
      </div>
      <div className="range-wrapper">
        <h3 className="slider-label">Noise</h3>
        <div className="range">
          <Slider.Root
            className="SliderRoot"
            name="noiseRatio"
            id="noiseRatio"
            value={[props.noiseRatio]}
            min={0}
            max={0.15}
            step={0.001}
            onValueChange={(value) =>
              props.handleChange({
                target: { name: "noiseRatio", value: value[0] },
              })
            }
          >
            <Slider.Track className="SliderTrack">
              <Slider.Range className="SliderRange" />
            </Slider.Track>
            <Slider.Thumb className="SliderThumb" />
          </Slider.Root>
        </div>
      </div>
    </div>
  );
}
