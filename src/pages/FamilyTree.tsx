import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { familyData, type FamilyDefinition, type FamilyNode as Node } from "../constants/family";

// Constants
const NODE_WIDTH = 100;
const NODE_HEIGHT = 120;
const NODE_PADDING = 8;
const CONNECTOR_OFFSET = 20;
const WORLD_MARGIN = 2000;
const FIT_PADDING = 40;

// Styling
const STYLES = {
  node: {
    fill: "#2a2a2a",
    textFill: "#ffffff",
    font: "14px 'Mantinia', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  },
  connector: {
    stroke: "#4a4a4a",
    strokeWidth: 1,
    markerSize: 4
  }
};

// Image cache manager
class ImageCache {
  private cache = new Map<string, HTMLImageElement>();
  private onUpdate: () => void;

  constructor(onUpdate: () => void) {
    this.onUpdate = onUpdate;
  }

  get(url: string): HTMLImageElement {
    let img = this.cache.get(url);
    if (!img) {
      img = new Image();
      img.src = url;
      img.onload = this.onUpdate;
      img.onerror = () => console.error("Failed to load image:", url);
      this.cache.set(url, img);
    }
    return img;
  }

  clear() {
    this.cache.clear();
  }
}

// Canvas renderer class
class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageCache: ImageCache;
  private devicePixelRatio: number;
  private connectionOffsets: Map<string, number>;

  constructor(ctx: CanvasRenderingContext2D, onRedraw: () => void) {
    this.ctx = ctx;
    this.imageCache = new ImageCache(onRedraw);
    this.devicePixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    this.connectionOffsets = new Map();
  }

  // Get or create a consistent random horizontal offset for a node
  private getNodeOffset(nodeId: string): number {
    if (!this.connectionOffsets.has(nodeId)) {
      this.connectionOffsets.set(nodeId, (Math.random() - 0.5) * 16);
    }
    return this.connectionOffsets.get(nodeId)!;
  }

  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }

  drawNode(node: Node) {
    const { x, y, name, image } = node;
    
    // Draw rectangle background
    this.ctx.fillStyle = STYLES.node.fill;
    this.ctx.fillRect(x, y, NODE_WIDTH, NODE_HEIGHT);

    // Draw image if available
    if (image) {
      const img = this.imageCache.get(image);
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        this.drawCoverImage(img, x, y, NODE_WIDTH, NODE_HEIGHT);
      }
    }

    // Draw label
    this.ctx.fillStyle = STYLES.node.textFill;
    this.ctx.font = STYLES.node.font;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(name, x + NODE_WIDTH / 2, y + NODE_HEIGHT + NODE_PADDING);
  }

  private drawCoverImage(img: HTMLImageElement, x: number, y: number, width: number, height: number) {
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const rectAspect = width / height;
    
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > rectAspect) {
      // Image is wider - fit to height, crop width
      drawHeight = height;
      drawWidth = height * imgAspect;
      drawX = x + (width - drawWidth) / 2;
      drawY = y;
    } else {
      // Image is taller - fit to width, crop height
      drawWidth = width;
      drawHeight = width / imgAspect;
      drawX = x;
      drawY = y + (height - drawHeight) / 2;
    }
    
    this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
  }

  drawXMarker(x: number, y: number) {
    const size = STYLES.connector.markerSize;
    this.ctx.strokeStyle = STYLES.connector.stroke;
    this.ctx.lineWidth = STYLES.connector.strokeWidth;
    
    // Draw X shape
    this.ctx.beginPath();
    this.ctx.moveTo(x - size, y - size);
    this.ctx.lineTo(x + size, y + size);
    this.ctx.moveTo(x + size, y - size);
    this.ctx.lineTo(x - size, y + size);
    this.ctx.stroke();
  }

  drawConnector(family: any, nodeMap: Map<string, Node>) {
    const p1 = nodeMap.get(family.parents[0]);
    const p2 = nodeMap.get(family.parents[1]);
    const children = family.children.map((id: string) => nodeMap.get(id)).filter(Boolean) as Node[];
    
    if (!p1 || !p2 || children.length === 0) return;

    // Use stored offsets for randomization
    const p1XOffset = this.getNodeOffset(p1.id + '_parent'); // Horizontal offset for parent 1
    const p2XOffset = this.getNodeOffset(p2.id + '_parent'); // Horizontal offset for parent 2

    // Determine which parent is on left and right
    const leftParent = p1.x < p2.x ? p1 : p2;
    const rightParent = p1.x < p2.x ? p2 : p1;
    const leftOffset = p1.x < p2.x ? p1XOffset : p2XOffset;
    const rightOffset = p1.x < p2.x ? p2XOffset : p1XOffset;

    // Connection points for the LINE (at actual node edges)
    const leftLinePoint = { 
      x: leftParent.x + NODE_WIDTH, // Right edge of left parent
      y: leftParent.y + NODE_HEIGHT / 2 // Center Y
    };
    const rightLinePoint = { 
      x: rightParent.x, // Left edge of right parent
      y: rightParent.y + NODE_HEIGHT / 2 // Center Y
    };
    
    const midPoint = { 
      x: (leftLinePoint.x + rightLinePoint.x) / 2, 
      y: (leftLinePoint.y + rightLinePoint.y) / 2 
    };

    // Setup connector style - solid gray lines
    this.ctx.strokeStyle = STYLES.connector.stroke;
    this.ctx.lineWidth = STYLES.connector.strokeWidth;

    // Draw spouse line between edges (straight line)
    this.ctx.beginPath();
    this.ctx.moveTo(leftLinePoint.x, leftLinePoint.y);
    this.ctx.lineTo(rightLinePoint.x, rightLinePoint.y);
    this.ctx.stroke();

    // Draw X markers with horizontal offset from the line endpoints
    this.drawXMarker(leftLinePoint.x + leftOffset, leftLinePoint.y);
    this.drawXMarker(rightLinePoint.x + rightOffset, rightLinePoint.y);

    // Calculate connector Y position
    const minChildY = d3.min(children, d => d.y) || 0;
    const connectorY = minChildY - (family.connectorYOffset ?? CONNECTOR_OFFSET);

    // Draw vertical line from midpoint
    this.ctx.beginPath();
    this.ctx.moveTo(midPoint.x, midPoint.y);
    this.ctx.lineTo(midPoint.x, connectorY);
    this.ctx.stroke();

    // Draw horizontal sibling connector (perfectly straight)
    const childCentersX = children
      .map(c => c.x + NODE_WIDTH / 2)
      .sort((a, b) => a - b);

    if (childCentersX.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(childCentersX[0], connectorY);
      this.ctx.lineTo(childCentersX[childCentersX.length - 1], connectorY);
      this.ctx.stroke();
    }

    // Draw drops to each child with X markers
    children.forEach(child => {
      const childCenterX = child.x + NODE_WIDTH / 2;
      const childYOffset = this.getNodeOffset(child.id + '_child'); // Vertical offset for children
      const childTopY = child.y + childYOffset; // Top of child node with vertical randomization
      
      // Draw vertical line to child (straight)
      this.ctx.beginPath();
      this.ctx.moveTo(childCenterX, connectorY);
      this.ctx.lineTo(childCenterX, childTopY);
      this.ctx.stroke();
      
      // Draw X marker at child connection point (top of node with vertical offset)
      this.drawXMarker(childCenterX, childTopY);
    });
  }

  render(
    canvasEl: HTMLCanvasElement,
    data: FamilyDefinition,
    nodes: Node[],
    nodeMap: Map<string, Node>,
    transform: d3.ZoomTransform
  ) {
    const pixelWidth = canvasEl.width;
    const pixelHeight = canvasEl.height;

    this.clear(pixelWidth, pixelHeight);

    this.ctx.save();
    this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    
    // Apply transform
    this.ctx.translate(transform.x, transform.y);
    this.ctx.scale(transform.k, transform.k);

    // Draw connectors first (behind nodes)
    (data.families || []).forEach(family => {
      if (family.parents.length >= 2 && family.children.length > 0) {
        this.drawConnector(family, nodeMap);
      }
    });

    // Draw nodes
    nodes.forEach(node => this.drawNode(node));

    this.ctx.restore();
  }

  destroy() {
    this.imageCache.clear();
  }
}

function FamilyTree() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // Process data once
  const { nodes, nodeMap, contentBounds } = useMemo(() => {
    const processedNodes = (familyData?.nodes ?? []).map(n => ({ 
      ...n, 
      size: n.size ?? 80 
    }));
    
    const map = new Map(processedNodes.map(n => [n.id, n] as const));
    
    // Calculate content bounds using D3 extent
    const xExtent = d3.extent(processedNodes, d => d.x) as [number, number];
    const yExtent = d3.extent(processedNodes, d => d.y) as [number, number];
    
    const bounds = {
      left: xExtent[0] || 0,
      right: (xExtent[1] || 0) + NODE_WIDTH,
      top: yExtent[0] || 0,
      bottom: (yExtent[1] || 0) + NODE_HEIGHT + NODE_PADDING * 2
    };

    return { 
      nodes: processedNodes, 
      nodeMap: map, 
      contentBounds: bounds 
    };
  }, []);

  useEffect(() => {
    const containerEl = containerRef.current;
    const canvasEl = canvasRef.current;
    if (!containerEl || !canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) {
      console.error("2D context not available");
      return;
    }

    // Initialize renderer
    const renderer = new CanvasRenderer(ctx, () => requestAnimationFrame(draw));
    rendererRef.current = renderer;

    const devicePixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));

    // Transform state
    let currentTransform = d3.zoomIdentity;

    function resizeCanvas() {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      canvasEl!.style.width = `${cssWidth}px`;
      canvasEl!.style.height = `${cssHeight}px`;
      canvasEl!.width = Math.max(1, Math.floor(cssWidth * devicePixelRatio));
      canvasEl!.height = Math.max(1, Math.floor(cssHeight * devicePixelRatio));

      draw();
    }

    function draw() {
      renderer.render(canvasEl!, familyData, nodes, nodeMap, currentTransform);
    }

    // Create zoom behavior using D3
    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.4, 4])
      .on("zoom", (event) => {
        currentTransform = event.transform;
        draw();
      });

    // Setup zoom extents
    function updateZoomExtents() {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      const extentBounds: [[number, number], [number, number]] = [
        [contentBounds.left - WORLD_MARGIN, contentBounds.top - WORLD_MARGIN],
        [contentBounds.right + WORLD_MARGIN, contentBounds.bottom + WORLD_MARGIN]
      ];

      zoom
        .extent([[0, 0], [cssWidth, cssHeight]])
        .translateExtent(extentBounds);
    }

    // Fit content to view
    function fitToView() {
      const cssWidth = containerEl!.clientWidth;
      const cssHeight = containerEl!.clientHeight;

      const contentWidth = contentBounds.right - contentBounds.left;
      const contentHeight = contentBounds.bottom - contentBounds.top;
      
      // Calculate scale to fit content
      const scale = Math.min(
        (cssWidth - FIT_PADDING * 2) / contentWidth,
        (cssHeight - FIT_PADDING * 2) / contentHeight,
        1 // Don't zoom in beyond 100%
      );

      // Center the content
      const offsetX = (cssWidth - contentWidth * scale) / 2 - contentBounds.left * scale;
      const offsetY = (cssHeight - contentHeight * scale) / 2 - contentBounds.top * scale;

      const initialTransform = d3.zoomIdentity
        .translate(offsetX, offsetY)
        .scale(scale);

      // Set initial position immediately without transition
      currentTransform = initialTransform;
      selection.call(zoom.transform, initialTransform);
    }

    // Initialize
    const selection = d3.select(canvasEl);
    selection.call(zoom);
    
    // Disable double-click zoom
    selection.on("dblclick.zoom", null);
    
    resizeCanvas();
    updateZoomExtents();
    fitToView();

    // Handle resize
    const handleResize = () => {
      resizeCanvas();
      updateZoomExtents();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      selection.on(".zoom", null);
      renderer.destroy();
    };
  }, [nodes, nodeMap, contentBounds]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-10">
      <canvas 
        ref={canvasRef} 
        aria-label="Family Tree Canvas"
        style={{ cursor: 'grab' }}
      />
    </div>
  );
}

export default FamilyTree;