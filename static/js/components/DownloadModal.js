import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloseIcon } from "../assets/CloseIcon";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@radix-ui/react-icons";

function DownloadModal({
  gradientValues,
  setShowDownload,
  setDownload,
  handleChange,
  exportScale,
  setExportScale,
}) {
  const { customWidth, customHeight } = gradientValues;

  const scaledWidth = customWidth * parseInt(exportScale, 10);
  const scaledHeight = customHeight * parseInt(exportScale, 10);

  const handleExportScaleChange = (value) => {
    setExportScale(value);
  };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        className="download-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { type: "spring", duration: 0, delay: 0 },
        }}
        exit={{ opacity: 0 }}
        onClick={() => setShowDownload(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 10,
        }}
      />
      <motion.div
        className="download-modal"
        initial={{ opacity: 0, y: 48, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", duration: 0.2, bounce: 0 }}
        exit={{
          opacity: 0,
          scale: 0.94,
          y: 0,
          transition: { type: "spring", duration: 0.2, bounce: 0 },
        }}
        style={{
          position: "fixed",
          transform: "translate(-50%, -50%)",
        }}
      >
        <motion.div
          onClick={() => setShowDownload(false)}
          className="icon upload-close-button"
          whileTap={{ scale: 0.96 }}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            cursor: "pointer",
          }}
        >
          <CloseIcon />
        </motion.div>
        <div className="download-modal-content">
          <div className="modal-title">
            <h3 className="label">Export settings</h3>
          </div>
          <div className="size-input-container">
            <div className="size-input">
              <h3 className="label">Width</h3>
              <input
                className="input-size"
                type="number"
                name="customWidth"
                id="customWidth"
                value={customWidth}
                min="1"
                max="10000"
                onChange={handleChange}
              />
            </div>
            <div className="size-input">
              <h3 className="label">Height</h3>
              <input
                className="input-size"
                type="number"
                name="customWidth"
                id="customWidth"
                value={customHeight}
                min="1"
                max="10000"
                onChange={handleChange}
              />
            </div>
            <div className="export-size">
              <Select.Root
                value={exportScale}
                onValueChange={handleExportScaleChange}
              >
                <Select.Trigger
                  className="SelectTrigger"
                  aria-label="Export Scale"
                >
                  <Select.Value placeholder="Select export scale…" />
                  <Select.Icon className="SelectIcon">
                    <ChevronDownIcon />
                  </Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="SelectContent">
                    <Select.Viewport className="SelectViewport">
                      {[1, 2, 3, 4].map((scale) => (
                        <Select.Item
                          key={`scale-${scale}`}
                          value={scale.toString()}
                          className="SelectItem"
                        >
                          <Select.ItemText>{scale}x</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>

          <div className="download-footer">
            {/* <motion.div
              className="modal-download-button copy"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShare(true);
                setShowDownload(false);
              }}
            >
              Copy
            </motion.div> */}
            <motion.div
              className="modal-download-button"
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setDownload(true);
                setShowDownload(false);
              }}
            >
              Download
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DownloadModal;
