import "./App.css";
import { useState, useCallback, useMemo, useRef } from "react";
import GradientCanvas from "./components/GradientCanvas";
import PanelControls from "./components/PanelControls";
import DownloadModal from "./components/DownloadModal";
import { WordMark } from "../src/assets/WordMark";
import { v4 as uuidv4 } from "uuid";

const gradientStyles = [
  { name: "Sharp Bézier", id: 4 },
  { name: "Soft Bézier", id: 1 },
  { name: "Mesh Static", id: 2 },
  { name: "Mesh Grid", id: 3 },
  { name: "Simple", id: 0 },
];

const warpShapes = [
  { name: "Simplex Noise", id: 0 },
  { name: "Circular", id: 1 },
  { name: "Value Noise", id: 2 },
  { name: "Worley Noise", id: 3 },
  { name: "FBM Noise", id: 4 },
  { name: "Voronoi Noise", id: 5 },
  { name: "Domain Warping", id: 6 },
  { name: "Waves", id: 7 },
  { name: "Smooth Noise", id: 8 },
  { name: "Oval", id: 9 },
  { name: "Rows", id: 10 },
  { name: "Columns", id: 11 },
  { name: "Flat", id: 12 },
  { name: "Gravity", id: 13 },
];

const colorSchemes = [
  ["#EB4679", "#051681", "#EE7F7D", "#265BC9", "#C25EA5", "#7961D3"],
  ["#92B3C9", "#C6D1D1", "#7B8E54", "#F66E56", "#F96656", "#F3F4EC"],
  ["#2483A5", "#E0B94B", "#477459", "#C45408", "#6E9091", "#EFE3D1", "#E4D5B9"],
  ["#0F2F65", "#E687D8", "#347BD1", "#6890E2", "#07265C", "#A88BDF"],
];

function generateRandomColorScheme() {
  const randomScheme =
    colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
  return randomScheme.map((color) => ({ id: uuidv4(), value: color }));
}

function getRandomWarpShape() {
  return Math.floor(Math.random() * warpShapes.length);
}

function getInitialCanvasSize() {
  // Check if window exists (for SSR compatibility)
  if (typeof window !== "undefined") {
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Use 9:19.5 aspect ratio for mobile (similar to iPhone)
      return {
        width: 376,
        height: 812,
      };
    }
  }

  // Default desktop size
  return {
    width: 648,
    height: 648,
  };
}

function App() {
  const initialColorScheme = useMemo(() => generateRandomColorScheme(), []);
  const initialWarpShape = useMemo(() => getRandomWarpShape(), []);
  const initialSize = useMemo(() => getInitialCanvasSize(), []);
  const gradientCanvasRef = useRef();

  const [gradientValues, setGradientValues] = useState({
    warpRatio: 0.4,
    warpSize: 1,
    noiseRatio: 0.08,
    colors: initialColorScheme,
    numberPoints: initialColorScheme.length,
    randomNumber: 0, // Start with 0 for grid layout
    widthExport: initialSize.width,
    heightExport: initialSize.height,
    gradientTypeIndex: 4,
    warpShapeIndex: initialWarpShape,
    motionEnabled: true,
    customWidth: initialSize.width,
    customHeight: initialSize.height,
  });

  const [showDownload, setShowDownload] = useState(false);
  const [download, setDownload] = useState(false);
  const [share, setShare] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [exportScale, setExportScale] = useState("1");

  const toggleUploadPanel = useCallback(() => {
    setShowUploadPanel((prev) => !prev);
  }, []);

  const regeneratePositions = useCallback(() => {
    setGradientValues((prevState) => ({
      ...prevState,
      randomNumber: Math.random(),
    }));
  }, []);

  const toggleMotion = useCallback(() => {
    setGradientValues((prevState) => ({
      ...prevState,
      motionEnabled: !prevState.motionEnabled,
    }));
  }, []);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setGradientValues((prevState) => {
      if (name === "colors") {
        return {
          ...prevState,
          colors: value,
          numberPoints: value.length,
        };
      }
      return {
        ...prevState,
        [name]: [
          "gradientTypeIndex",
          "warpShapeIndex",
          "numberPoints",
        ].includes(name)
          ? parseInt(value, 10)
          : value,
      };
    });
  }, []);

  const updateGradientColors = useCallback((newColors, newPositions) => {
    setGradientValues((prevState) => ({
      ...prevState,
      colors: newColors,
      numberPoints: newColors.length,
      positions: newPositions,
    }));
  }, []);

  const colorChange = useCallback((color, index) => {
    setGradientValues((prevState) => {
      const newColors = [...prevState.colors];
      newColors[index].value = color;
      return {
        ...prevState,
        colors: newColors,
      };
    });
  }, []);

  const addColor = useCallback((color) => {
    setGradientValues((prevState) => {
      if (prevState.numberPoints < 10) {
        const newColors = [...prevState.colors, { id: uuidv4(), value: color }];
        return {
          ...prevState,
          colors: newColors,
          numberPoints: prevState.numberPoints + 1,
        };
      }
      return prevState;
    });
  }, []);

  const changeNumber = useCallback((event) => {
    const { id, value } = event.target;
    setGradientValues((prevState) => {
      const newColors = [...prevState.colors];
      let newNumberPoints = prevState.numberPoints;
      if (id === "+") {
        newNumberPoints++;
        newColors.push({ id: uuidv4(), value: value || "#FFFFFF" });
      } else {
        newNumberPoints--;
        newColors.splice(parseInt(id), 1);
      }
      return {
        ...prevState,
        numberPoints: newNumberPoints,
        colors: newColors,
        randomNumber: 0, // Reset to grid layout when changing number of points
      };
    });
  }, []);

  const exportP5Code = useCallback(() => {
    if (gradientCanvasRef.current) {
      gradientCanvasRef.current.exportP5Code();
    }
  }, []);

  return (
    <>
      <div className="app">
        <div className="content">
          <GradientCanvas
            ref={gradientCanvasRef}
            share={share}
            download={download}
            setShare={setShare}
            setDownload={setDownload}
            exportScale={exportScale}
            gradientValues={{
              ...gradientValues,
              bgColor: gradientValues.colors[0].value,
              exportScale,
            }}
            gradientStyles={gradientStyles}
            warpShapes={warpShapes}
            showUploadPanel={showUploadPanel}
            toggleUploadPanel={toggleUploadPanel}
            updateGradientColors={updateGradientColors}
          />
          <PanelControls
            setShowDownload={setShowDownload}
            handleChange={handleChange}
            changeNumber={changeNumber}
            colorChange={colorChange}
            addColor={addColor}
            gradientValues={{
              ...gradientValues,
              bgColor: gradientValues.colors[0].value,
            }}
            gradientStyles={gradientStyles}
            warpShapes={warpShapes}
            toggleUploadPanel={toggleUploadPanel}
            regeneratePositions={regeneratePositions}
            toggleMotion={toggleMotion}
            exportP5Code={exportP5Code}
          />
          {showDownload && (
            <DownloadModal
              setShare={setShare}
              setDownload={setDownload}
              setShowDownload={setShowDownload}
              gradientValues={{
                ...gradientValues,
                bgColor: gradientValues.colors[0].value,
              }}
              handleChange={handleChange}
              download={download}
              share={share}
              exportScale={exportScale}
              setExportScale={setExportScale}
            />
          )}
        </div>
      </div>
      <footer className="footer">
        <div className="logo">
          <img
            src="https://i.ibb.co/GfQs6nyX/logo.png"
            alt="logo for Photo Gradient"
          ></img>
          <WordMark />
          {/* <div className="credit"></div> */}
        </div>

        <div className="credit">
          <a href="https://mohamedkhire.vercel.app/">Made by Mohamed Khire</a>
          <div>© 2025</div>
        </div>
      </footer>
    </>
  );
}

export default App;
