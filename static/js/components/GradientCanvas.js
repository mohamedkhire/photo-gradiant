import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useImperativeHandle,
} from "react";
import p5 from "p5";
import { motion, AnimatePresence } from "framer-motion";
import vert from "./shader.vert";
import frag from "./shader.frag";
import { CloseIcon } from "../assets/CloseIcon";
import { RemoveIcon } from "../assets/RemoveIcon";
import { AddIcon } from "../assets/AddIcon";
import { v4 as uuidv4 } from "uuid";

const GradientCanvas = React.forwardRef((props, ref) => {
  const containerRef = useRef();
  const [sketch, setSketch] = useState(undefined);
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [tempGradientPoints, setTempGradientPoints] = useState([]);
  const canvasRef = useRef(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const imagePreviewRef = useRef(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [imageScale, setImageScale] = useState({
    scaleX: 1,
    scaleY: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [currentPositions, setCurrentPositions] = useState([]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target.result);
        analyzeImage(e.target.result);
        setIsPasteMode(false);
        setIsDragging(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPoint = () => {
    if (tempGradientPoints.length < 10) {
      // Generate random coordinates within the image
      const newX = Math.random() * 100;
      const newY = Math.random() * 100;

      // Get the color at these coordinates
      const newColor = getColorAtPoint(newX, newY);

      const newPoint = {
        x: newX,
        y: newY,
        color: newColor,
      };

      setTempGradientPoints((prev) => [...prev, newPoint]);
    }
  };

  const handleRemovePoint = () => {
    if (tempGradientPoints.length > 1) {
      setTempGradientPoints((prev) => prev.slice(0, -1));
    }
  };

  const handleUploadAreaClick = useCallback(() => {
    if (!imageDataUrl) {
      setIsPasteMode(true);
    }
  }, [imageDataUrl]);

  const analyzeImage = useCallback((dataUrl) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const container = imagePreviewRef.current;

      const containerAspectRatio =
        container.clientWidth / container.clientHeight;
      const imageAspectRatio = img.width / img.height;

      let newWidth,
        newHeight,
        offsetX = 0,
        offsetY = 0;

      if (containerAspectRatio > imageAspectRatio) {
        newHeight = container.clientHeight;
        newWidth = newHeight * imageAspectRatio;
        offsetX = (container.clientWidth - newWidth) / 2;
      } else {
        newWidth = container.clientWidth;
        newHeight = newWidth / imageAspectRatio;
        offsetY = (container.clientHeight - newHeight) / 2;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      setImageDimensions({ width: newWidth, height: newHeight });
      setImageScale({
        scaleX: newWidth / img.width,
        scaleY: newHeight / img.height,
        offsetX,
        offsetY,
      });

      const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
      const uniqueColors = findUniqueColors(imageData, 9);

      const points = uniqueColors.map(({ x, y, color }) => ({
        x: (x / newWidth) * 100,
        y: (y / newHeight) * 100,
        color: `rgb(${color.r}, ${color.g}, ${color.b})`,
      }));

      setTempGradientPoints(points);
    };
    img.src = dataUrl;
  }, []);

  // Helper function to find unique colors
  const findUniqueColors = (imageData, numColors) => {
    const { width, height, data } = imageData;
    const colors = [];
    const gridSize = 10; // Adjust this for finer or coarser sampling

    for (let y = 0; y < height; y += height / gridSize) {
      for (let x = 0; x < width; x += width / gridSize) {
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        colors.push({
          x: Math.floor(x),
          y: Math.floor(y),
          color: { r: data[i], g: data[i + 1], b: data[i + 2] },
        });
      }
    }

    // Sort colors by uniqueness (using a simple diff method)
    colors.sort((a, b) => {
      const aDiff = colorDifference(a.color, { r: 128, g: 128, b: 128 });
      const bDiff = colorDifference(b.color, { r: 128, g: 128, b: 128 });
      return bDiff - aDiff;
    });

    // Select the most unique colors
    const uniqueColors = [colors[0]];
    for (let i = 1; i < colors.length && uniqueColors.length < numColors; i++) {
      if (
        uniqueColors.every(
          (uColor) => colorDifference(uColor.color, colors[i].color) > 30 // Adjust threshold as needed
        )
      ) {
        uniqueColors.push(colors[i]);
      }
    }

    return uniqueColors;
  };

  // Helper function to calculate color difference
  const colorDifference = (color1, color2) => {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
        Math.pow(color1.g - color2.g, 2) +
        Math.pow(color1.b - color2.b, 2)
    );
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setIsPasteMode(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          setImageDataUrl(event.target.result);
          analyzeImage(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    },
    [analyzeImage]
  );

  const toggleUploadPanel = useCallback(() => {
    props.toggleUploadPanel();
    setIsPasteMode(false);
    setIsDragging(false);
    setImageDataUrl(null);
    setTempGradientPoints([]);
  }, [props.toggleUploadPanel]);

  const handlePaste = useCallback(
    (event) => {
      if (!isPasteMode) return;

      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageDataUrl(e.target.result);
            analyzeImage(e.target.result);
            setIsPasteMode(false);
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    },
    [isPasteMode, analyzeImage]
  );

  useEffect(() => {
    if (isPasteMode) {
      window.addEventListener("paste", handlePaste);
    } else {
      window.removeEventListener("paste", handlePaste);
    }

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isPasteMode, handlePaste]);

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    window.addEventListener("dragover", preventDefault);
    window.addEventListener("drop", preventDefault);

    return () => {
      window.removeEventListener("dragover", preventDefault);
      window.removeEventListener("drop", preventDefault);
    };
  }, []);

  useEffect(() => {
    if (!props.showUploadPanel) {
      setIsPasteMode(false);
      setIsDragging(false);
      if (!props.gradientValues.colors.length) {
        setImageDataUrl(null);
        setTempGradientPoints([]);
      }
    }
  }, [props.showUploadPanel, props.gradientValues.colors.length]);

  const handleConfirmColors = () => {
    console.log("Temp gradient points before conversion:", tempGradientPoints);

    const newColors = tempGradientPoints.map((point) => ({
      id: uuidv4(),
      value: rgbToHex(point.color),
    }));
    const newPositions = tempGradientPoints
      .map((point) => [point.x / 100, point.y / 100])
      .flat();

    props.updateGradientColors(newColors, newPositions);
    setTempGradientPoints([]);
    setImageDataUrl(null);
    props.toggleUploadPanel();

    if (sketch) {
      sketch.updateProps({
        ...props,
        gradientValues: {
          ...props.gradientValues,
          bgColor: newColors[0].value,
          colors: newColors,
          numberPoints: newColors.length,
          positions: newPositions,
        },
      });
    }
  };

  const handlePointDragStart = (index) => (e) => {
    e.preventDefault();
    setDraggingPoint(index);
  };

  const handlePointDragEnd = () => {
    setDraggingPoint(null);
  };

  const getColorAtPoint = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    // Convert percentage to actual pixel coordinates
    const pixelX = Math.floor((x / 100) * canvas.width);
    const pixelY = Math.floor((y / 100) * canvas.height);
    // Ensure we're within the canvas boundaries
    const safeX = Math.max(0, Math.min(canvas.width - 1, pixelX));
    const safeY = Math.max(0, Math.min(canvas.height - 1, pixelY));
    const imageData = ctx.getImageData(safeX, safeY, 1, 1);
    const [r, g, b] = imageData.data;
    return `rgb(${r}, ${g}, ${b})`;
  };

  const handlePointDrag = useCallback(
    (e) => {
      if (draggingPoint !== null && imagePreviewRef.current) {
        const rect = imagePreviewRef.current.getBoundingClientRect();
        const clientX = e.type.includes("touch")
          ? e.touches[0].clientX
          : e.clientX;
        const clientY = e.type.includes("touch")
          ? e.touches[0].clientY
          : e.clientY;

        const x = Math.max(
          0,
          Math.min(
            100,
            ((clientX - rect.left - imageScale.offsetX) /
              imageDimensions.width) *
              100
          )
        );
        const y = Math.max(
          0,
          Math.min(
            100,
            ((clientY - rect.top - imageScale.offsetY) /
              imageDimensions.height) *
              100
          )
        );

        setTempGradientPoints((prevPoints) => {
          const newPoints = [...prevPoints];
          if (newPoints[draggingPoint]) {
            newPoints[draggingPoint] = {
              ...newPoints[draggingPoint],
              x,
              y,
              color: getColorAtPoint(x, y),
            };
          }
          return newPoints;
        });
      }
    },
    [draggingPoint, imageScale, imageDimensions, getColorAtPoint]
  );

  const getWorkingDimensions = (targetWidth, targetHeight) => {
    const MAX_SIZE = 648;
    const aspectRatio = targetWidth / targetHeight;

    let workingWidth, workingHeight;

    if (aspectRatio > 1) {
      // Wider than tall
      workingWidth = Math.min(MAX_SIZE, targetWidth);
      workingHeight = workingWidth / aspectRatio;
    } else {
      // Taller than wide or square
      workingHeight = Math.min(MAX_SIZE, targetHeight);
      workingWidth = workingHeight * aspectRatio;
    }

    return {
      width: Math.round(workingWidth),
      height: Math.round(workingHeight),
    };
  };

  const Sketch = (p) => {
    let {
      widthExport,
      heightExport,
      randomNumber,
      warpRatio,
      warpSize,
      noiseRatio,
      bgColor,
      colors,
      numberPoints,
      gradientTypeIndex,
      warpShapeIndex,
      positions,
      exportScale,
      customWidth,
      customHeight,
    } = props.gradientValues;

    let theShader;
    let spaceCount = p.random(100);
    let positionsUniforms = [];
    let canvasDiv;
    let showPoints = false;
    let points = [];
    let isMobile = false;
    let isDownloading = false;
    let mobilePointsVisible = false;
    let lastTapTime = 0;

    const DESKTOP_POINT_SIZE = 20;
    const MOBILE_POINT_SIZE = 24;
    const DOUBLE_TAP_DELAY = 300;

    p.preload = function () {
      theShader = p.loadShader(vert, frag);
    };

    p.setup = function () {
      p.pixelDensity(2);
      canvasDiv = document.getElementById("GradientCanvas");
      const { width, height } = getWorkingDimensions(customWidth, customHeight);
      let cnv = p.createCanvas(width, height, p.WEBGL);

      // Check if the device is mobile
      isMobile =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      if (!isMobile) {
        cnv.mouseOver(() => {
          showPoints = true;
        });
        cnv.mouseOut(() => {
          showPoints = false;
        });
      }

      const gl = p.canvas.getContext("webgl2");
      gl.disable(gl.DEPTH_TEST);

      p.windowResized();
      p.noStroke();

      initializePoints();

      setCanvasReady(true);
    };

    p.draw = function () {
      p.background(0);
      setShaderUniforms();
      p.shader(theShader);
      p.rect(0, 0, p.width, p.height);

      if ((showPoints || (isMobile && mobilePointsVisible)) && !isDownloading) {
        drawPoints();
      }
    };

    p.windowResized = function () {
      const { width, height } = getWorkingDimensions(customWidth, customHeight);
      p.resizeCanvas(width, height);
    };

    p.updateProps = function (newProps) {
      const oldProps = {
        randomNumber,
        numberPoints,
        gradientTypeIndex,
        colors,
        warpRatio,
        warpSize,
        noiseRatio,
        bgColor,
        warpShapeIndex,
        positions,
        customHeight,
        customWidth,
      };

      ({
        widthExport,
        heightExport,
        randomNumber,
        warpRatio,
        warpSize,
        noiseRatio,
        bgColor,
        colors,
        numberPoints,
        gradientTypeIndex,
        warpShapeIndex,
        positions,
        exportScale,
        customHeight,
        customWidth,
      } = newProps.gradientValues);

      // Add resize check
      if (
        oldProps.customWidth !== customWidth ||
        oldProps.customHeight !== customHeight
      ) {
        const { width, height } = getWorkingDimensions(
          customWidth,
          customHeight
        );
        p.resizeCanvas(width, height);
        initializePoints();
      }

      randomNumber = +randomNumber;

      // Only reinitialize points if randomNumber has changed or if the number of points has changed
      if (
        oldProps.randomNumber !== randomNumber ||
        oldProps.numberPoints !== numberPoints
      ) {
        initializePoints();
      } else if (
        positions &&
        positions.length === numberPoints * 2 &&
        JSON.stringify(positions) !== JSON.stringify(oldProps.positions)
      ) {
        // If new positions are provided (e.g., from image color selection), use them
        updatePositionsFromProp(positions);
      }

      // Always update colors, even if points haven't been reinitialized
      updateColors();

      // Update warp-related properties without reinitializing points
      if (
        oldProps.warpRatio !== warpRatio ||
        oldProps.warpSize !== warpSize ||
        oldProps.noiseRatio !== noiseRatio ||
        oldProps.gradientTypeIndex !== gradientTypeIndex ||
        oldProps.warpShapeIndex !== warpShapeIndex
      ) {
        // We don't need to do anything here, as these will be updated in setShaderUniforms
      }

      if (oldProps.randomNumber !== randomNumber) {
        spaceCount = p.random(100);
      }
    };

    function updatePositionsFromProp(newPositions) {
      for (let i = 0; i < numberPoints; i++) {
        points[i].x = newPositions[i * 2] * p.width;
        points[i].y = newPositions[i * 2 + 1] * p.height;
      }
      updatePositionsUniforms();
    }

    function updateColors() {
      for (let i = 0; i < numberPoints; i++) {
        points[i].color = colors[i].value;
      }
    }

    function initializePoints() {
      points = [];
      if (randomNumber !== 0) {
        // Use random layout
        for (let i = 0; i < numberPoints; i++) {
          points.push({
            x: p.random() * p.width,
            y: p.random() * p.height,
            clicked: false,
            color: colors[i].value,
          });
        }
      } else if (positions && positions.length === numberPoints * 2) {
        // Use the positions provided from image color selection or last known positions
        for (let i = 0; i < numberPoints; i++) {
          points.push({
            x: positions[i * 2] * p.width,
            y: positions[i * 2 + 1] * p.height,
            clicked: false,
            color: colors[i].value,
          });
        }
      } else {
        // Use grid layout as fallback
        const gridSize = Math.ceil(Math.sqrt(numberPoints));
        const cellSize = 1 / gridSize;
        for (let i = 0; i < numberPoints; i++) {
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          points.push({
            x: (col + 0.5) * cellSize * p.width,
            y: (row + 0.5) * cellSize * p.height,
            clicked: false,
            color: colors[i].value,
          });
        }
      }
      updatePositionsUniforms();
    }

    function updatePositionsUniforms() {
      positionsUniforms = points
        .map((point) => [point.x / p.width, point.y / p.height])
        .flat();
      setCurrentPositions(positionsUniforms);
    }

    function drawPoints() {
      p.resetShader();
      p.translate(-p.width / 2, -p.height / 2);
      const pointSize = isMobile ? MOBILE_POINT_SIZE : DESKTOP_POINT_SIZE;
      for (let i = 0; i < numberPoints; i++) {
        p.fill(255);
        p.circle(points[i].x, points[i].y, pointSize);
        p.fill(points[i].color);
        p.circle(points[i].x, points[i].y, pointSize * 0.75);
      }
    }

    function setShaderUniforms() {
      const actualWidth = p.width * p.pixelDensity();
      const actualHeight = p.height * p.pixelDensity();
      theShader.setUniform("u_resolution", [actualWidth, actualHeight]);
      // theShader.setUniform("u_resolution", [p.width, p.height]);
      theShader.setUniform("u_bgColor", hexToRgb(bgColor));
      theShader.setUniform(
        "u_colors",
        colors
          .slice(0, numberPoints)
          .flatMap((colorObj) => hexToRgb(colorObj.value))
      );
      theShader.setUniform("u_positions", positionsUniforms);
      theShader.setUniform("u_numberPoints", numberPoints);
      theShader.setUniform("u_noiseRatio", noiseRatio);
      theShader.setUniform("u_warpRatio", warpRatio);
      theShader.setUniform("u_mouse", [
        p.mouseX / p.width,
        1 - p.mouseY / p.height,
      ]);
      theShader.setUniform("u_warpSize", warpSize);
      theShader.setUniform("u_gradientTypeIndex", gradientTypeIndex);
      theShader.setUniform("u_warpShapeIndex", warpShapeIndex);
      // theShader.setUniform("u_time", p.millis() / 2000.0);
      theShader.setUniform("u_noiseTime", 0.0);
    }

    function getCanvasDimensions() {
      var computedStyle = getComputedStyle(canvasDiv);
      let elementHeight = canvasDiv.clientHeight;
      let elementWidth = canvasDiv.clientWidth;
      elementHeight -=
        parseFloat(computedStyle.paddingTop) +
        parseFloat(computedStyle.paddingBottom);
      elementWidth -=
        parseFloat(computedStyle.paddingLeft) +
        parseFloat(computedStyle.paddingRight);
      return {
        width: Math.min(elementHeight, elementWidth),
        height: Math.min(elementHeight, elementWidth),
      };
    }

    p.mousePressed = function () {
      const pointSize = isMobile ? MOBILE_POINT_SIZE : DESKTOP_POINT_SIZE;
      for (let i = 0; i < numberPoints; i++) {
        let dist = p.dist(
          p.mouseX - p.width / 2,
          p.mouseY - p.height / 2,
          points[i].x - p.width / 2,
          points[i].y - p.height / 2
        );
        points[i].clicked = dist < pointSize / 2;
      }
    };

    p.mouseDragged = function () {
      for (let i = 0; i < numberPoints; i++) {
        if (points[i].clicked) {
          points[i].x = p.mouseX;
          points[i].y = p.mouseY;
        }
      }
      updatePositionsUniforms();
    };

    p.download = function () {
      isDownloading = true;
      const scale = parseInt(exportScale || props.exportScale, 10);

      // Save current canvas state
      const originalSize = { width: p.width, height: p.height };
      const originalNoiseRatio = noiseRatio;
      const originalWarpSize = warpSize;

      // Resize to the full requested dimensions
      p.resizeCanvas(customWidth * scale, customHeight * scale);
      p.draw();
      p.save("image-mesh-gradient.png");

      // Reset to working dimensions
      const { width, height } = getWorkingDimensions(customWidth, customHeight);
      p.resizeCanvas(width, height);
      noiseRatio = originalNoiseRatio;
      warpSize = originalWarpSize;
      p.draw();

      isDownloading = false;
    };

    p.share = function () {
      isDownloading = true;
      const originalSize = { width: p.width, height: p.height };
      const scale = parseInt(props.exportScale, 10);
      p.resizeCanvas(widthExport * scale, heightExport * scale);
      p.draw(); // Redraw without points
      p.canvas.toBlob((blob) => {
        var file = new File([blob], "image-mesh-gradient.png", {
          type: "image/png",
        });
        var filesArray = [file];
        if (navigator.canShare && navigator.canShare({ files: filesArray })) {
          navigator.share({
            files: filesArray,
            title: "Mesh Gradient",
          });
        }
      });
      p.resizeCanvas(originalSize.width, originalSize.height);
      isDownloading = false;
    };

    p.touchStarted = function (event) {
      if (event.target === p.canvas) {
        const currentTime = p.millis();
        if (currentTime - lastTapTime < DOUBLE_TAP_DELAY) {
          // Double tap detected, toggle points visibility
          mobilePointsVisible = !mobilePointsVisible;
        } else {
          // Single tap, check for point interaction
          p.mousePressed();
        }
        lastTapTime = currentTime;
        return false;
      }
    };

    p.touchMoved = function (event) {
      if (event.target === p.canvas) {
        p.mouseDragged();
        return false; // Prevent default
      }
    };
  };

  const exportP5Code = () => {
    const {
      warpRatio,
      warpSize,
      noiseRatio,
      colors,
      numberPoints,
      gradientTypeIndex,
      warpShapeIndex,
      customWidth,
      customHeight,
    } = props.gradientValues;

    const code = `
      "use client";
  
      import React, { useRef, useEffect } from 'react';
      import p5 from 'p5';
  
      const P5Wrapper = () => {
        const canvasRef = useRef();
  
        useEffect(() => {
          const sketch = (p) => {
            let warpRatio = ${warpRatio};
            let warpSize = ${warpSize};
            let noiseRatio = ${noiseRatio};
            let colors = ${JSON.stringify(colors.map((c) => c.value))};
            let numberPoints = ${numberPoints};
            let gradientTypeIndex = ${gradientTypeIndex};
            let warpShapeIndex = ${warpShapeIndex};
            let positions = ${JSON.stringify(currentPositions)};
            let theShader;
  
            p.preload = () => {
              theShader = p.loadShader('/shaders/shader.vert', '/shaders/shader.frag');
            };
  
            p.setup = () => {
              p.createCanvas(${customWidth}, ${customHeight}, p.WEBGL);
              p.pixelDensity(2);
              p.noStroke();
            };
  
            p.draw = () => {
              p.background(0);
  
              const actualWidth = p.width * p.pixelDensity();
              const actualHeight = p.height * p.pixelDensity();
              theShader.setUniform("u_resolution", [actualWidth, actualHeight]);
              theShader.setUniform("u_time", p.millis() / 1000.0);
              theShader.setUniform("u_noiseTime", 0.0);
              theShader.setUniform("u_mouse", [p.mouseX / p.width, 1 - p.mouseY / p.height]);
              theShader.setUniform("u_warpRatio", warpRatio);
              theShader.setUniform("u_warpSize", warpSize);
              theShader.setUniform("u_noiseRatio", noiseRatio);
              theShader.setUniform("u_gradientTypeIndex", gradientTypeIndex);
              theShader.setUniform("u_warpShapeIndex", warpShapeIndex);
              theShader.setUniform("u_numberPoints", numberPoints);
              theShader.setUniform("u_bgColor", hexToRgb(colors[0]));
              theShader.setUniform("u_colors", colors.flatMap(hexToRgb));
              theShader.setUniform("u_positions", positions);
  
              p.shader(theShader);
              p.rect(0, 0, p.width, p.height);
            };
  
            function hexToRgb(hex) {
              let result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
              return result ? [
                parseInt(result[1], 16) / 255,
                parseInt(result[2], 16) / 255,
                parseInt(result[3], 16) / 255
              ] : null;
            }
          };
  
          const p5Instance = new p5(sketch, canvasRef.current);
  
          return () => {
            p5Instance.remove();
          };
        }, []);
  
        return <div ref={canvasRef}></div>;
      };
  
      export default P5Wrapper;
    `;

    // Create and trigger download
    const blob = new Blob([code], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "GradientCanvas.js";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!sketch) {
      let inst = new p5(Sketch, containerRef.current);
      setSketch(inst);
    } else {
      sketch.updateProps(props);
    }
  }, [props]);

  useEffect(() => {
    if (props.download) {
      sketch.download();
      props.setDownload(false);
    }
  }, [props.download, props.exportScale]);

  useEffect(() => {
    return () => {
      if (sketch) {
        sketch.remove();
      }
    };
  }, [sketch]);

  useEffect(() => {
    if (props.share) {
      sketch.share();
      props.setShare(false);
    }
  }, [props.share]);

  useImperativeHandle(ref, () => ({
    exportP5Code,
  }));
  return (
    <>
      <div className="canvas-column" id="">
        <motion.div
          className="gradient-wrapper"
          style={{
            borderRadius: 32,
            originX: 0.5,
            width: 648,
            height: 648,
            position: "relative",
            // overflow: 'hidden',
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!canvasReady && (
            <motion.div
              className="loading-indicator"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#fff",
                borderRadius: 32,
                zIndex: 1,
              }}
            ></motion.div>
          )}
          <motion.div
            className="canvas-container"
            style={{
              opacity: canvasReady ? 1 : 0,
              width: getWorkingDimensions(
                props.gradientValues.customWidth,
                props.gradientValues.customHeight
              ).width,
              height: getWorkingDimensions(
                props.gradientValues.customWidth,
                props.gradientValues.customHeight
              ).height,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: canvasReady ? 1 : 0,
              scale: canvasReady ? 1 : 0.9,
            }}
            transition={{ duration: 0.4, type: "spring" }}
          >
            <div
              className="GradientCanvas"
              id="GradientCanvas"
              ref={containerRef}
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              {/* The p5 sketch will be rendered here */}
            </div>
          </motion.div>
        </motion.div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
      <AnimatePresence initial={false} mode="popLayout">
        {props.showUploadPanel && (
          <>
            <motion.div
              className="upload-panel-overlay"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                transition: { type: "spring", duration: 0, delay: 0 },
              }}
              exit={{ opacity: 0 }}
              onClick={toggleUploadPanel}
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
              className="upload-panel"
              initial={{ opacity: 0, y: 48, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", duration: 0.2, bounce: 0 }}
              exit={{
                opacity: 0,
                scale: 0.94,
                y: 0,
                transition: { type: "spring", duration: 0.2, bounce: 0 },
              }}
            >
              <div
                className={`upload-area ${isDragging ? "dragging" : ""} ${
                  isPasteMode ? "paste-mode" : ""
                }`}
                onClick={handleUploadAreaClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {!imageDataUrl ? (
                  <div className="upload-message">
                    <div className="upload-empty-state">
                      <motion.div
                        className="empty-state-image-wrapper"
                        initial={{ opacity: 1, scale: 0.1, rotate: 45, y: 64 }}
                        animate={{ opacity: 1, scale: 1, rotate: -5, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, rotate: -10, y: 0 }}
                        transition={{
                          type: "spring",
                          duration: 0.45,
                          bounce: 0.3,
                          delay: 0.05,
                        }}
                        style={{ rotate: -5, borderRadius: 16 }}
                      >
                        <motion.span
                          className="dot dot-1"
                          style={{ y: 16, x: 16, backgroundColor: "#96B3C3" }}
                        ></motion.span>
                        <motion.span
                          className="dot dot-2"
                          style={{ y: 32, x: 68, backgroundColor: "#C2D3DB" }}
                        ></motion.span>
                        <motion.span
                          className="dot dot-3"
                          style={{ y: 96, x: 34, backgroundColor: "#C6D0C5" }}
                          animate={{
                            y: [96, 80, 80, 96],
                            x: [34, 50, 50, 34],
                            backgroundColor: [
                              "#C6D0C5",
                              "#CAD2D1",
                              "#CAD2D1",
                              "#C6D0C5",
                            ],
                          }}
                          transition={{
                            duration: 3,
                            times: [0, 0.2, 0.8, 1],
                            ease: "easeOut",
                            repeat: Infinity,
                            repeatDelay: 2,
                            delay: 0.25,
                          }}
                        ></motion.span>
                        <motion.span
                          className="dot dot-4"
                          style={{ y: 138, x: 17, backgroundColor: "#94A996" }}
                        ></motion.span>
                        <motion.span
                          className="dot dot-5"
                          style={{ y: 96, x: 152, backgroundColor: "#869384" }}
                          animate={{
                            y: [96, 76, 76, 96],
                            x: [152, 152, 152, 152],
                            backgroundColor: [
                              "#869384",
                              "#BECFD0",
                              "#BECFD0",
                              "#869384",
                            ],
                          }}
                          transition={{
                            duration: 3,
                            times: [0, 0.2, 0.8, 1],
                            ease: "easeOut",
                            repeat: Infinity,
                            repeatDelay: 2,
                            delay: 1.75,
                          }}
                        ></motion.span>
                        {/* <motion.span className="dot dot-6" style={{ y: 96, x: 152, backgroundColor: "#869384" }}></motion.span> */}
                        <motion.span
                          className="dot dot-7"
                          style={{ y: 116, x: 119, backgroundColor: "#F19F92" }}
                        ></motion.span>
                        <motion.span
                          className="dot dot-8"
                          style={{ y: 136, x: 112, backgroundColor: "#E96C4D" }}
                        ></motion.span>
                        <motion.img
                          className="empty-state-image"
                          style={{ borderRadius: 16 }}
                          src="https://i.ibb.co/ccTWFcgd/thedippingshop-1740931220-3579512971030932529-1182359918.jpg"
                        />
                      </motion.div>
                      <motion.img
                        initial={{ opacity: 1, scale: 0.1, rotate: -45, y: 64 }}
                        animate={{ opacity: 1, scale: 1, rotate: 5, y: 0 }}
                        exit={{ opacity: 0, scale: 0.6, rotate: -10, y: 44 }}
                        transition={{
                          type: "spring",
                          duration: 0.45,
                          bounce: 0.3,
                          delay: 0.0,
                        }}
                        style={{ rotate: 5, borderRadius: 16 }}
                        className="empty-state-gradient"
                        src="https://i.ibb.co/GfQs6nyX/logo.png"
                      />
                    </div>
                    <h3 className="upload-label">
                      Paste or{" "}
                      <label className="link">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                        />
                        upload a photo
                      </label>{" "}
                      to turn it into a beautiful gradient
                    </h3>
                  </div>
                ) : (
                  <div
                    className="image-preview"
                    ref={imagePreviewRef}
                    onMouseMove={handlePointDrag}
                    onMouseUp={handlePointDragEnd}
                    onMouseLeave={handlePointDragEnd}
                    onTouchMove={handlePointDrag}
                    onTouchEnd={handlePointDragEnd}
                  >
                    <img
                      src={imageDataUrl}
                      alt="Uploaded"
                      style={{
                        display: "block",
                        width: `${imageDimensions.width}px`,
                        height: `${imageDimensions.height}px`,
                        position: "absolute",
                        left: `${imageScale.offsetX}px`,
                        top: `${imageScale.offsetY}px`,
                      }}
                    />
                    <div
                      className="color-points"
                      style={{
                        position: "absolute",
                        top: `${imageScale.offsetY}px`,
                        left: `${imageScale.offsetX}px`,
                        width: `${imageDimensions.width}px`,
                        height: `${imageDimensions.height}px`,
                        pointerEvents: "none",
                      }}
                    >
                      {tempGradientPoints.map((point, index) => (
                        <div
                          key={index}
                          className="color-point"
                          style={{
                            position: "absolute",
                            left: `${point.x}%`,
                            top: `${point.y}%`,
                            width: "20px",
                            height: "20px",
                            backgroundColor: point.color,
                            borderRadius: "50%",
                            cursor: "pointer",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "auto",
                            zIndex: hoveredPoint === index ? 10 : 1,
                            touchAction: "none",
                          }}
                          onMouseDown={handlePointDragStart(index)}
                          onTouchStart={handlePointDragStart(index)}
                          onMouseEnter={() => setHoveredPoint(index)}
                          onMouseLeave={() => setHoveredPoint(null)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <motion.div
                onClick={toggleUploadPanel}
                className="icon upload-close-button"
                whileTap={{ scale: 0.96 }}
              >
                <CloseIcon />
              </motion.div>
              {imageDataUrl && (
                <div className="image-controls">
                  <div className="point-controls">
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      className={`remove-point image-control ${
                        tempGradientPoints.length <= 2 ? "disabled-button" : ""
                      }`}
                      onClick={handleRemovePoint}
                      disabled={tempGradientPoints.length <= 2}
                    >
                      <RemoveIcon /> Color
                    </motion.div>
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      className={`add-point image-control ${
                        tempGradientPoints.length >= 10 ? "disabled-button" : ""
                      }`}
                      onClick={handleAddPoint}
                      disabled={tempGradientPoints.length >= 10}
                    >
                      <AddIcon /> Color
                    </motion.div>
                  </div>

                  <div
                    className="confirm-button image-control"
                    onClick={handleConfirmColors}
                  >
                    Done
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
});

function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b;
  });
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : null;
}

function rgbToHex(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
}

export default GradientCanvas;
