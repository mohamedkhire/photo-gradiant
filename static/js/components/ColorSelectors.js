import React, { useState, useEffect, useCallback } from "react";
import { ColorPicker } from "./ColorPicker";
import { HexColorInput } from "react-colorful";
import { motion, Reorder, useDragControls } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import * as Tooltip from "@radix-ui/react-tooltip";

export function ColorSelectors(props) {
  const { colors, numberPoints } = props;
  const [colorObjects, setColorObjects] = useState([]);
  const [activeColorPicker, setActiveColorPicker] = useState(null);
  const dragControls = useDragControls();

  useEffect(() => {
    // Update colorObjects whenever colors prop changes
    setColorObjects(
      colors.map((color) => ({
        id: color.id || uuidv4(),
        value: color.value || color,
      }))
    );
  }, [colors]);

  const handleColorPickerClick = (index) => {
    setActiveColorPicker(index);
  };

  const handleClickOutside = useCallback((e) => {
    if (!e.target.closest(".color-picker-container")) {
      setActiveColorPicker(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleReorder = (newOrder) => {
    setColorObjects(newOrder);
    props.handleChange({
      target: {
        value: newOrder,
        name: "colors",
      },
    });
  };

  const handleGenerate = () => {
    props.regeneratePositions();
  };

  const handleAddColor = (color = "#FFFFFF") => {
    if (numberPoints < 10) {
      const newColorObject = { id: uuidv4(), value: color };
      const newColors = [...colorObjects, newColorObject];
      setColorObjects(newColors);
      props.handleChange({
        target: {
          value: newColors,
          name: "colors",
        },
      });
    }
  };

  const handleRemoveColor = (index) => {
    if (numberPoints > 1) {
      const newColors = colorObjects.filter((_, i) => i !== index);
      setColorObjects(newColors);
      props.handleChange({
        target: {
          value: newColors,
          name: "colors",
        },
      });
    }
  };

  const handleColorChange = (color, index) => {
    const newColorObjects = colorObjects.map((obj, i) =>
      i === index ? { ...obj, value: color } : obj
    );
    setColorObjects(newColorObjects);
    props.handleChange({
      target: {
        value: newColorObjects,
        name: "colors",
      },
    });
  };

  return (
    <div className="colors-list">
      <div className="heading-wrapper">
        <h3 className="label">Colors</h3>
        <Tooltip.Provider>
          <div className="icon-controls">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="add" onClick={props.toggleUploadPanel}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M16.6667 6H7.33333C6.59695 6 6 6.59695 6 7.33333V16.6667C6 17.403 6.59695 18 7.33333 18H16.6667C17.403 18 18 17.403 18 16.6667V7.33333C18 6.59695 17.403 6 16.6667 6Z"
                      stroke="black"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.33333 10.6667C10.0697 10.6667 10.6667 10.0697 10.6667 9.33333C10.6667 8.59695 10.0697 8 9.33333 8C8.59695 8 8 8.59695 8 9.33333C8 10.0697 8.59695 10.6667 9.33333 10.6667Z"
                      stroke="black"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M17.9997 13.9998L14.6663 10.6665L7.33301 17.9998"
                      stroke="black"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="TooltipContent" sideOffset={5}>
                  Upload image
                  <Tooltip.Arrow className="TooltipArrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="add" onClick={handleGenerate}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.5 3V5.5H10M6 10.5H3.5V13"
                      stroke="black"
                      strokeOpacity="0.9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.99998 3.5C5.68343 3.5 3.77571 5.25044 3.52735 7.5008C3.49706 7.77528 3.27612 8 2.99998 8V8C2.72384 8 2.4976 7.7754 2.52237 7.50037C2.7748 4.69694 5.13083 2.5 7.99998 2.5C9.72916 2.5 11.272 3.29799 12.2802 4.54579C12.4539 4.76074 12.3902 5.07317 12.1603 5.22646V5.22646C11.9306 5.37955 11.6224 5.31549 11.4447 5.10432C10.6192 4.12336 9.38239 3.5 7.99998 3.5ZM3.83967 10.7735C3.60973 10.9268 3.54605 11.2393 3.71973 11.4542C4.72799 12.702 6.27079 13.5 7.99998 13.5C10.8691 13.5 13.2252 11.3031 13.4776 8.49963C13.5024 8.2246 13.2761 8 13 8V8C12.7238 8 12.5029 8.22472 12.4726 8.4992C12.2242 10.7496 10.3165 12.5 7.99998 12.5C6.61757 12.5 5.38075 11.8766 4.55528 10.8957C4.37758 10.6845 4.06931 10.6204 3.83967 10.7735V10.7735Z"
                      fill="black"
                      fillOpacity="0.9"
                    />
                  </svg>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="TooltipContent" sideOffset={5}>
                  Randomize positions
                  <Tooltip.Arrow className="TooltipArrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>

            {numberPoints < 10 && (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div className="add" onClick={() => handleAddColor()}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.41268 7.5879L13.587 7.58736C13.815 7.58734 13.9999 7.77227 13.9997 8.00031V8.00031C13.9996 8.2281 13.8148 8.41267 13.5871 8.41267H8.41152L8.41206 13.5876C8.41209 13.8154 8.22746 14 7.9997 14V14C7.77195 14 7.58733 13.8154 7.58733 13.5876V8.41209L2.4124 8.41262C2.18465 8.41265 2 8.22802 2 8.00026V8.00026C2 7.77252 2.18462 7.5879 2.41236 7.5879H7.58791L7.58683 2.41304C7.58679 2.18498 7.77173 2.00013 7.99978 2.00029V2.00029C8.22756 2.00045 8.41212 2.18513 8.41215 2.41291L8.41268 7.5879Z"
                        fill="black"
                      />
                    </svg>
                  </div>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="TooltipContent" sideOffset={5}>
                    Add color
                    <Tooltip.Arrow className="TooltipArrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )}
          </div>
        </Tooltip.Provider>
      </div>

      <Reorder.Group
        axis="y"
        values={colorObjects}
        onReorder={handleReorder}
        className="list"
      >
        {colorObjects.map((colorObj, index) => (
          <Reorder.Item
            key={colorObj.id}
            value={colorObj}
            className={`color-list-item ${
              activeColorPicker === index ? "active-color-picker" : ""
            }`}
            dragListener={activeColorPicker === null}
            dragControls={dragControls}
          >
            <svg
              className="drag-handle"
              width="8"
              height="24"
              viewBox="0 0 8 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="7" width="6" height="2" rx="1" fill="#D9D9D9" />
              <rect x="1" y="11" width="6" height="2" rx="1" fill="#D9D9D9" />
              <rect x="1" y="15" width="6" height="2" rx="1" fill="#D9D9D9" />
            </svg>

            <motion.div className="color-input-wrapper">
              <div
                className="color-picker-container"
                onClick={() => handleColorPickerClick(index)}
              >
                <ColorPicker
                  color={colorObj.value}
                  onChange={(e) => handleColorChange(e, index)}
                />
              </div>
              <HexColorInput
                color={colorObj.value}
                className="color-input"
                onChange={(e) => handleColorChange(e, index)}
              />
            </motion.div>
            {index > 0 && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      className="remove"
                      onClick={() => handleRemoveColor(index)}
                    >
                      <svg
                        className="svg"
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="6"
                        viewBox="0 0 12 6"
                      >
                        <path
                          fill="#000"
                          fillOpacity="1"
                          fillRule="nonzero"
                          stroke="none"
                          d="M11.5 3.5H.5v-1h11v1z"
                        ></path>
                      </svg>
                    </div>
                  </Tooltip.Trigger>

                  <Tooltip.Portal>
                    <Tooltip.Content className="TooltipContent" sideOffset={5}>
                      Remove color
                      <Tooltip.Arrow className="TooltipArrow" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
            {numberPoints < 10 && (
              <Tooltip.Provider>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div
                      className="add-color"
                      onClick={() => handleAddColor(colorObj.value)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.41268 7.5879L13.587 7.58736C13.815 7.58734 13.9999 7.77227 13.9997 8.00031V8.00031C13.9996 8.2281 13.8148 8.41267 13.5871 8.41267H8.41152L8.41206 13.5876C8.41209 13.8154 8.22746 14 7.9997 14V14C7.77195 14 7.58733 13.8154 7.58733 13.5876V8.41209L2.4124 8.41262C2.18465 8.41265 2 8.22802 2 8.00026V8.00026C2 7.77252 2.18462 7.5879 2.41236 7.5879H7.58791L7.58683 2.41304C7.58679 2.18498 7.77173 2.00013 7.99978 2.00029V2.00029C8.22756 2.00045 8.41212 2.18513 8.41215 2.41291L8.41268 7.5879Z"
                          fill="black"
                        />
                      </svg>
                    </div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="TooltipContent" sideOffset={5}>
                      Duplicate color
                      <Tooltip.Arrow className="TooltipArrow" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}

export default ColorSelectors;
