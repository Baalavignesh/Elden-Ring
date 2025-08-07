import { useEffect, useRef } from "react";
import * as d3 from "d3";

function FamilyTree() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const containerEl = containerRef.current;
    const canvasEl = canvasRef.current;
    if (!containerEl || !canvasEl) return;

    const ctx = canvasEl.getContext("2d") as CanvasRenderingContext2D;

    const devicePixelRatioSafe = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    const squareSize = 80;
    const coupleY = 80;
    const coupleGap = 120;
    const childrenY = 280;
    const sonsGap = 160;

    const husbandX = 300;
    const wifeX = husbandX + squareSize + coupleGap;
    const son1X = 300;
    const son2X = son1X + squareSize + sonsGap;

    const nodeFill = "#2a2a2a";
    const textFill = "#ffffff";
    const lineStroke = "#9ca3af";

    const contentBounds = {
      left: husbandX,
      right: Math.max(wifeX + squareSize, son2X + squareSize),
      top: coupleY,
      bottom: childrenY + squareSize + 24,
    };

    const transformRef = { current: d3.zoomIdentity } as { current: d3.ZoomTransform };
    const edgePaddingPx = 24; // keep at least this many screen pixels of the content visible

    function resizeCanvas() {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      canvasEl!.style.width = `${cssWidth}px`;
      canvasEl!.style.height = `${cssHeight}px`;
      canvasEl!.width = Math.max(1, Math.floor(cssWidth * devicePixelRatioSafe));
      canvasEl!.height = Math.max(1, Math.floor(cssHeight * devicePixelRatioSafe));

      draw();
    }

    function draw() {
      const pixelWidth = canvasEl!.width;
      const pixelHeight = canvasEl!.height;

      ctx.clearRect(0, 0, pixelWidth, pixelHeight);

      ctx.save();
      ctx.scale(devicePixelRatioSafe, devicePixelRatioSafe);
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      // lines
      const husbandCenterX = husbandX + squareSize / 2;
      const husbandCenterY = coupleY + squareSize / 2;
      const wifeCenterX = wifeX + squareSize / 2;
      const midX = (husbandCenterX + wifeCenterX) / 2;
      const midY = husbandCenterY;
      const connectorY = childrenY - 20;
      const son1CenterX = son1X + squareSize / 2;
      const son2CenterX = son2X + squareSize / 2;

      ctx.strokeStyle = lineStroke;
      ctx.lineWidth = 2;

      // spouse connector
      ctx.beginPath();
      ctx.moveTo(husbandCenterX, midY);
      ctx.lineTo(wifeCenterX, midY);
      ctx.stroke();

      // vertical from midpoint
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(midX, connectorY);
      ctx.stroke();

      // horizontal sibling connector
      ctx.beginPath();
      ctx.moveTo(Math.min(son1CenterX, son2CenterX), connectorY);
      ctx.lineTo(Math.max(son1CenterX, son2CenterX), connectorY);
      ctx.stroke();

      // drops to children
      [son1CenterX, son2CenterX].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, connectorY);
        ctx.lineTo(x, childrenY);
        ctx.stroke();
      });

      // nodes
      function drawSquareWithLabel(x: number, y: number, name: string) {
        ctx.fillStyle = nodeFill;
        ctx.fillRect(x, y, squareSize, squareSize);

        ctx.fillStyle = textFill;
        ctx.font = "14px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(name, x + squareSize / 2, y + squareSize + 8);
      }

      drawSquareWithLabel(husbandX, coupleY, "Husband");
      drawSquareWithLabel(wifeX, coupleY, "Wife");
      drawSquareWithLabel(son1X, childrenY, "Son 1");
      drawSquareWithLabel(son2X, childrenY, "Son 2");

      ctx.restore();
    }

    const zoomBehavior = d3
      .zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.4, 4])
      .on("zoom", (event) => {
        updateZoomExtents(event.transform.k);
        transformRef.current = event.transform;
        draw();
      });

    const selection = d3.select(canvasEl!);

    function updateZoomExtents(k: number) {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      // Expand the translate extent by the viewport size so the content edge stays visible
      const worldEdge = edgePaddingPx / k;
      const minX = contentBounds.left - (cssWidth / k - worldEdge);
      const minY = contentBounds.top - (cssHeight / k - worldEdge);
      const maxX = contentBounds.right + (cssWidth / k - worldEdge);
      const maxY = contentBounds.bottom + (cssHeight / k - worldEdge);

      zoomBehavior
        .extent([[0, 0], [cssWidth, cssHeight]])
        .translateExtent([[minX, minY], [maxX, maxY]]);
    }

    updateZoomExtents(transformRef.current.k);
    selection.call(zoomBehavior as any);

    function fitToView() {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      const contentWidth = contentBounds.right - contentBounds.left;
      const contentHeight = contentBounds.bottom - contentBounds.top;
      const padding = 40;
      const scale = Math.min(
        (cssWidth - padding * 2) / contentWidth,
        (cssHeight - padding * 2) / contentHeight
      );

      const offsetX = (cssWidth - contentWidth * scale) / 2 - contentBounds.left * scale;
      const offsetY = (cssHeight - contentHeight * scale) / 2 - contentBounds.top * scale;

      const initial = d3.zoomIdentity.translate(offsetX, offsetY).scale(scale);
      updateZoomExtents(scale);
      selection.call(zoomBehavior.transform as any, initial);
    }

    resizeCanvas();
    fitToView();

    const handleResize = () => {
      resizeCanvas();
      updateZoomExtents(transformRef.current.k);
      fitToView();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      selection.on(".zoom", null);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0">
      <canvas ref={canvasRef} aria-label="Family Tree Canvas" />
    </div>
  );
}

export default FamilyTree;