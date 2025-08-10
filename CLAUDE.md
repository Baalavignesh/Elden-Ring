# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an interactive Elden Ring family tree visualization application built with React, TypeScript, and Canvas rendering. The project displays character relationships through a custom-built canvas visualization with zoom/pan capabilities.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Note: No testing or linting commands are currently configured.

## Architecture

### Core Technologies
- **React 19** with TypeScript for component architecture
- **Vite** as build tool and dev server
- **Canvas 2D API** for high-performance tree rendering (not DOM-based)
- **D3.js** for zoom/pan transformations only
- **Tailwind CSS 4.1** (latest version using new import syntax)

### Key Architectural Decisions

1. **Canvas Rendering**: The family tree uses HTML5 Canvas instead of SVG/DOM for performance. All drawing logic is in `src/pages/FamilyTree.tsx`.

2. **Data Structure**: Family relationships are defined in `src/constants/family.ts` with TypeScript types:
   - `Node`: Character data (id, name, image, positions, relationships)
   - `Connector`: Visual connectors between nodes with styling options

3. **Asset Management**: Character portraits are PNG files in `/public/assets/`. Direct path references are used (e.g., `/assets/marika.png`).

4. **Styling**: Dark theme with black background. Custom Mantinia font is available but currently commented out in `src/index.css`.

## Important Implementation Details

### Canvas Rendering Pattern
The FamilyTree component manages:
- Canvas 2D context for drawing
- D3 zoom behavior for pan/zoom
- Device pixel ratio handling for sharp rendering
- Lazy image loading with caching
- Custom connector drawing between family members

### State Management
Currently using local component state. No global state management library is installed.

### Routing
React Router is installed but minimally used - only the FamilyTree page is implemented.

### Unused Dependencies
- **GSAP**: Imported but not used (potential for animations)
- **React Router**: Configured but only one route exists

## Known Issues and Considerations

1. **No Testing Infrastructure**: Project lacks test setup - consider when adding new features
2. **Font Loading**: Mantinia font CSS is commented out - may need proper font loading strategy
3. **Type Safety**: Some directories (`src/types/`, `src/hooks/`) are prepared but empty
4. **Build Output**: Vite builds to `dist/` directory

## File Modification Guidelines

When modifying the family tree:
1. Update data in `src/constants/family.ts`
2. Add character images as PNG to `/public/assets/`
3. Canvas drawing logic is centralized in `src/pages/FamilyTree.tsx`
4. Global styles use Tailwind utilities in `src/index.css`

## Performance Considerations

- Canvas rendering is chosen over DOM for performance with many nodes
- Images are lazy-loaded and cached in memory
- Device pixel ratio is handled for retina displays
- Zoom/pan uses D3's optimized transform calculations