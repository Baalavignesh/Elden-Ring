import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
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
    textFill: "#cccccc", // Changed to much brighter white/gray
    font: "16px 'Mantinia', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
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
  private chalkPatterns: Map<string, {
    segments: Array<{x: number, y: number, opacity: number, width: number}>,
    gaps: Array<{x: number, y: number, size: number}>,
    dust: Array<{x: number, y: number, size: number, opacity: number}>
  }>;
  hoveredNode: string | null = null;
  private hoverAnimation: Map<string, number> = new Map();

  constructor(ctx: CanvasRenderingContext2D, onRedraw: () => void) {
    this.ctx = ctx;
    this.imageCache = new ImageCache(onRedraw);
    this.devicePixelRatio = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    this.connectionOffsets = new Map();
    this.chalkPatterns = new Map();
  }

  // Get or create a consistent random horizontal offset for a node
  private getNodeOffset(nodeId: string): number {
    if (!this.connectionOffsets.has(nodeId)) {
      this.connectionOffsets.set(nodeId, (Math.random() - 0.5) * 16);
    }
    return this.connectionOffsets.get(nodeId)!;
  }

  // Generate and cache chalk pattern for a line
  private getChalkPattern(lineKey: string, x1: number, y1: number, x2: number, y2: number) {
    if (!this.chalkPatterns.has(lineKey)) {
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const segments = Math.max(10, Math.floor(distance / 2)); // More segments for smoother line
      
      // Generate segment patterns
      const segmentPattern = [];
      for (let i = 0; i <= segments; i++) { // Include last point
        segmentPattern.push({
          x: (Math.random() - 0.5) * 0.5, // Very subtle wobble
          y: (Math.random() - 0.5) * 0.5,
          opacity: 0.35 + Math.random() * 0.2, // Less variation
          width: STYLES.connector.strokeWidth + Math.random() * 0.2
        });
      }
      
      // Generate gap positions
      const gaps = [];
      const gapCount = Math.floor(distance / 15);
      for (let i = 0; i < gapCount; i++) {
        gaps.push({
          x: Math.random() + (Math.random() - 0.5) * 2,
          y: Math.random() + (Math.random() - 0.5) * 2,
          size: 0.3 + Math.random() * 0.7
        });
      }
      
      // Generate dust particles
      const dust = [];
      const dustCount = Math.floor(distance / 10);
      for (let i = 0; i < dustCount; i++) {
        dust.push({
          x: Math.random() + (Math.random() - 0.5) * 3,
          y: Math.random() + (Math.random() - 0.5) * 3,
          size: Math.random() * 0.8,
          opacity: 0.1 + Math.random() * 0.3
        });
      }
      
      this.chalkPatterns.set(lineKey, {
        segments: segmentPattern,
        gaps: gaps,
        dust: dust
      });
    }
    return this.chalkPatterns.get(lineKey)!;
  }

  clear(width: number, height: number) {
    this.ctx.clearRect(0, 0, width, height);
  }

  setHoveredNode(nodeId: string | null) {
    this.hoveredNode = nodeId;
  }

  updateHoverAnimations() {
    let hasChanges = false;
    
    // Update animation values
    this.hoverAnimation.forEach((value, nodeId) => {
      const target = this.hoveredNode === nodeId ? 1 : 0;
      const diff = target - value;
      
      if (Math.abs(diff) > 0.01) {
        // Smooth animation using easing
        this.hoverAnimation.set(nodeId, value + diff * 0.15);
        hasChanges = true;
      } else if (target === 0 && value !== 0) {
        this.hoverAnimation.delete(nodeId);
      }
    });
    
    // Add new hovered node if not in map
    if (this.hoveredNode && !this.hoverAnimation.has(this.hoveredNode)) {
      this.hoverAnimation.set(this.hoveredNode, 0);
      hasChanges = true;
    }
    
    return hasChanges;
  }

  drawNode(node: Node) {
    const { x, y, name, image, id } = node;
    
    // Get hover animation value (0 to 1)
    const hoverValue = this.hoverAnimation.get(id) || 0;
    
    // Calculate scale and position adjustments
    const scale = 1 + hoverValue * 0.05; // Scale up to 110%
    const scaledWidth = NODE_WIDTH * scale;
    const scaledHeight = NODE_HEIGHT * scale;
    const offsetX = (scaledWidth - NODE_WIDTH) / 2;
    const offsetY = (scaledHeight - NODE_HEIGHT) / 2;
    
    // Save context for transforms
    this.ctx.save();
    
    // Apply brightness filter for hover
    if (hoverValue > 0) {
      this.ctx.filter = `brightness(${1 + hoverValue * 0.3})`; // Up to 30% brighter
    }
    
    // Draw rectangle background with scale
    this.ctx.fillStyle = STYLES.node.fill;
    this.ctx.fillRect(x - offsetX, y - offsetY, scaledWidth, scaledHeight);

    // Draw image if available
    if (image) {
      const img = this.imageCache.get(image);
      if (img.complete && img.naturalWidth && img.naturalHeight) {
        this.drawCoverImage(img, x - offsetX, y - offsetY, scaledWidth, scaledHeight);
      }
    }
    
    // Restore context
    this.ctx.restore();

    // Draw label (no scaling/brightness for text)
    this.ctx.fillStyle = STYLES.node.textFill;
    this.ctx.font = STYLES.node.font;
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "top";
    this.ctx.fillText(name, x, y + NODE_HEIGHT + NODE_PADDING);
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
    
    // Draw X shape with chalk effect
    this.drawChalkLine(x - size, y - size, x + size, y + size);
    this.drawChalkLine(x + size, y - size, x - size, y + size);
  }

  drawChalkLine(x1: number, y1: number, x2: number, y2: number, lineKey?: string) {
    // Use provided key or generate one from coordinates
    const key = lineKey || `${x1},${y1}-${x2},${y2}`;
    const pattern = this.getChalkPattern(key, x1, y1, x2, y2);
    const segments = pattern.segments.length - 1;
    
    // Draw with cached pattern - multiple overlapping strokes for texture
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // First pass - very faint base line
    this.ctx.strokeStyle = `rgba(130, 130, 130, 0.15)`;
    this.ctx.lineWidth = STYLES.connector.strokeWidth + 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    
    // Second pass - main chalky segments with cached variation
    for (let i = 0; i < segments; i++) {
      const t1 = i / segments;
      const t2 = (i + 1) / segments;
      
      // Overlap segments for continuity
      const overlapT1 = Math.max(0, t1 - 0.02);
      const overlapT2 = Math.min(1, t2 + 0.02);
      
      const startX = x1 + (x2 - x1) * overlapT1 + pattern.segments[i].x;
      const startY = y1 + (y2 - y1) * overlapT1 + pattern.segments[i].y;
      const endX = x1 + (x2 - x1) * overlapT2 + pattern.segments[Math.min(i + 1, pattern.segments.length - 1)].x;
      const endY = y1 + (y2 - y1) * overlapT2 + pattern.segments[Math.min(i + 1, pattern.segments.length - 1)].y;
      
      // More opacity variation for chalk texture
      this.ctx.strokeStyle = `rgba(170, 170, 170, ${pattern.segments[i].opacity * 0.8})`;
      this.ctx.lineWidth = pattern.segments[i].width;
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }
    
    // Third pass - add cached gaps for texture
    for (const gap of pattern.gaps) {
      const gapX = x1 + (x2 - x1) * gap.x;
      const gapY = y1 + (y2 - y1) * gap.y;
      // Small clear spots for chalk texture
      this.ctx.clearRect(gapX - gap.size/2, gapY - gap.size/2, gap.size, gap.size);
    }
    
    // Add cached chalk dust particles
    for (const particle of pattern.dust) {
      const dustX = x1 + (x2 - x1) * particle.x;
      const dustY = y1 + (y2 - y1) * particle.y;
      this.ctx.fillStyle = `rgba(180, 180, 180, ${particle.opacity})`;
      this.ctx.fillRect(dustX, dustY, particle.size, particle.size);
    }
  }

  drawConnector(family: any, nodeMap: Map<string, Node>) {
    const p1 = nodeMap.get(family.parents[0]);
    const p2 = family.parents[1] ? nodeMap.get(family.parents[1]) : null;
    const children = family.children.map((id: string) => nodeMap.get(id)).filter(Boolean) as Node[];
    
    if (!p1 || children.length === 0) return;

    // Separate children by Y level
    const childYLevels = [...new Set(children.map(c => c.y))].sort((a, b) => a - b);
    const mainChildY = childYLevels[0]; // Use the topmost (first) level as main
    const mainLevelChildren = children.filter(c => c.y === mainChildY);
    const otherLevelChildren = children.filter(c => c.y !== mainChildY);

    // Main connector Y position - at the main children's level
    const connectorY = mainChildY - (family.connectorYOffset ?? CONNECTOR_OFFSET);

    let midPoint: { x: number, y: number };

    if (p2) {
      // Two parents - draw spouse connection
      const p1XOffset = this.getNodeOffset(p1.id + '_parent');
      const p2XOffset = this.getNodeOffset(p2.id + '_parent');

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
      
      midPoint = { 
        x: (leftLinePoint.x + rightLinePoint.x) / 2, 
        y: (leftLinePoint.y + rightLinePoint.y) / 2 
      };

      // Draw spouse line between edges with chalk effect
      this.drawChalkLine(leftLinePoint.x, leftLinePoint.y, rightLinePoint.x, rightLinePoint.y, 
        `spouse-${p1.id}-${p2.id}`);

      // Draw X markers with horizontal offset from the line endpoints
      this.drawXMarker(leftLinePoint.x + leftOffset, leftLinePoint.y);
      this.drawXMarker(rightLinePoint.x + rightOffset, rightLinePoint.y);
    } else {
      // Single parent - connect directly to children
      midPoint = {
        x: p1.x + NODE_WIDTH / 2, // Center of parent node
        y: p1.y + NODE_HEIGHT // Bottom of parent node
      };
      
      // Draw X marker at bottom of parent node
      const p1XOffset = this.getNodeOffset(p1.id + '_parent');
      this.drawXMarker(midPoint.x + p1XOffset, midPoint.y);
    }

    // Draw vertical line from parent midpoint down to main children's connector level
    this.drawChalkLine(midPoint.x, midPoint.y, midPoint.x, connectorY, 
      `vertical-${p1.id}${p2 ? '-' + p2.id : ''}`);

    // Draw horizontal line connecting main level siblings
    if (mainLevelChildren.length > 1) {
      const mainChildCentersX = mainLevelChildren
        .map(c => c.x + NODE_WIDTH / 2)
        .sort((a, b) => a - b);
      
      this.drawChalkLine(mainChildCentersX[0], connectorY, mainChildCentersX[mainChildCentersX.length - 1], connectorY,
        `main-sibling-${mainLevelChildren[0].id}-${mainLevelChildren[mainLevelChildren.length - 1].id}`);
    }
    
    // Check if we need to extend vertical line further down for lower children like Rykard
    const lowerChildrenInBetween = otherLevelChildren.filter(child => {
      const childCenterX = child.x + NODE_WIDTH / 2;
      return mainLevelChildren.length > 1 && 
        childCenterX >= Math.min(...mainLevelChildren.map(c => c.x)) &&
        childCenterX <= Math.max(...mainLevelChildren.map(c => c.x + NODE_WIDTH));
    });
    
    // If we have lower children between siblings, extend the vertical line from the connector down
    if (lowerChildrenInBetween.length > 0) {
      const lowestY = Math.max(...lowerChildrenInBetween.map(c => c.y - (family.connectorYOffset ?? CONNECTOR_OFFSET)));
      this.drawChalkLine(midPoint.x, connectorY, midPoint.x, lowestY,
        `vertical-extension-${p1.id}${p2 ? '-' + p2.id : ''}`);
    }

    // RED PATTERN: Draw drops from horizontal connector to main level children
    mainLevelChildren.forEach(child => {
      const childCenterX = child.x + NODE_WIDTH / 2;
      const childYOffset = this.getNodeOffset(child.id + '_child');
      const childTopY = child.y + childYOffset;
      
      this.drawChalkLine(childCenterX, connectorY, childCenterX, childTopY,
        `drop-${child.id}`);
      
      this.drawXMarker(childCenterX, childTopY);
    });

    // For children at other levels (like Rykard), connect from the main horizontal line
    if (otherLevelChildren.length > 0) {
      otherLevelChildren.forEach(child => {
        const childCenterX = child.x + NODE_WIDTH / 2;
        const childYOffset = this.getNodeOffset(child.id + '_child');
        const childTopY = child.y + childYOffset;
        
        // Check if this child is positioned between siblings at the main level
        const isInBetween = mainLevelChildren.length > 1 && 
          childCenterX >= Math.min(...mainLevelChildren.map(c => c.x)) &&
          childCenterX <= Math.max(...mainLevelChildren.map(c => c.x + NODE_WIDTH));
        
        if (isInBetween) {
          // For Rykard case: need intermediate connector
          const childConnectorY = child.y - (family.connectorYOffset ?? CONNECTOR_OFFSET);
          
          // Draw horizontal line at Rykard's level from parent vertical to his position
          this.drawChalkLine(midPoint.x, childConnectorY, childCenterX, childConnectorY,
            `rykard-horizontal-${child.id}`);
          
          // Drop from that horizontal to Rykard
          this.drawChalkLine(childCenterX, childConnectorY, childCenterX, childTopY,
            `drop-${child.id}`);
        } else {
          // For children outside the main sibling range, draw angled connection
          const childConnectorY = child.y - (family.connectorYOffset ?? CONNECTOR_OFFSET);
          
          // Vertical drop from parent
          this.drawChalkLine(midPoint.x, connectorY, midPoint.x, childConnectorY,
            `level-drop-${child.id}`);
          
          // Horizontal to child position
          this.drawChalkLine(midPoint.x, childConnectorY, childCenterX, childConnectorY,
            `level-horizontal-${child.id}`);
          
          // Drop to child
          this.drawChalkLine(childCenterX, childConnectorY, childCenterX, childTopY,
            `drop-${child.id}`);
        }
        
        this.drawXMarker(childCenterX, childTopY);
      });
    }
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

  isNodeHovered(node: Node, mouseX: number, mouseY: number, transform: d3.ZoomTransform): boolean {
    // Transform mouse coordinates to canvas space
    const canvasX = (mouseX - transform.x) / transform.k;
    const canvasY = (mouseY - transform.y) / transform.k;
    
    // Check if mouse is within node bounds
    return canvasX >= node.x && 
           canvasX <= node.x + NODE_WIDTH &&
           canvasY >= node.y && 
           canvasY <= node.y + NODE_HEIGHT;
  }

  destroy() {
    this.imageCache.clear();
  }
}

interface FamilyTreeProps {
  tilt: { x: number; y: number; z: number };
}

function FamilyTree({ tilt }: FamilyTreeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Tilt effect is now handled globally in App.tsx

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
    let animationFrame: number | null = null;

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

    function animate() {
      const hasChanges = renderer.updateHoverAnimations();
      if (hasChanges) {
        draw();
        animationFrame = requestAnimationFrame(animate);
      } else {
        animationFrame = null;
      }
    }


    function handleCanvasMouseMove(event: MouseEvent) {
      const rect = canvasEl!.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Find hovered node
      let hoveredNodeId: string | null = null;
      for (const node of nodes) {
        if (renderer.isNodeHovered(node, mouseX, mouseY, currentTransform)) {
          hoveredNodeId = node.id;
          break;
        }
      }
      
      // Update hover state
      const previousHovered = renderer.hoveredNode;
      renderer.setHoveredNode(hoveredNodeId);
      
      // Start animation if hover state changed
      if (previousHovered !== hoveredNodeId && !animationFrame) {
        animationFrame = requestAnimationFrame(animate);
      }
      
      // Update cursor
      canvasEl!.style.cursor = hoveredNodeId ? 'pointer' : 'default';
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
      
      // Calculate scale to fit content (80% zoom level)
      const scale = Math.min(
        (cssWidth - FIT_PADDING * 2) / contentWidth,
        (cssHeight - FIT_PADDING * 2) / contentHeight,
        0.8 // Start at 80% zoom level
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
    canvasEl.addEventListener("mousemove", handleCanvasMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvasEl.removeEventListener("mousemove", handleCanvasMouseMove);
      selection.on(".zoom", null);
      renderer.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [nodes, nodeMap, contentBounds]);

  return (
    <motion.div 
      ref={containerRef} 
      className="fixed inset-0 z-10"
      style={{
        perspective: '1200px', // Increased perspective for stronger 3D effect
        transformStyle: 'preserve-3d'
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 2.5, 
        ease: [0.16, 1, 0.3, 1], // custom easing for smooth deceleration
        delay: 0.5
      }}
    >
      {/* Main canvas */}
      <motion.canvas 
        ref={canvasRef} 
        aria-label="Family Tree Canvas"
        style={{ 
          cursor: 'default',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.z}px)`,
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', // Smoother, premium easing
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          borderRadius: '8px'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
          delay: 1.2
        }}
      />
    </motion.div>
  );
}

export default FamilyTree;