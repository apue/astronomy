# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Venus Transit Astronomy** is an interactive 3D educational website demonstrating how 18th-century astronomers calculated the Earth-Sun distance using Venus transit parallax measurements. Built with Three.js and modern web technologies.

## Quick Commands

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Lint JavaScript files
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

### Testing & Debugging
```bash
# The app includes built-in debugging features:
# - Press F12 in dev mode to access window.app instance
# - FPS counter visible in console during development
# - WebGL compatibility check on startup
```

## Architecture Overview

### Core Systems
- **SceneManager** (`src/core/SceneManager.js`) - 3D scene orchestration, camera, lighting
- **CelestialBody** (`src/objects/CelestialBody.js`) - Base class for astronomical objects
- **TimeController** (`src/core/TimeController.js`) - Time manipulation and animation
- **ParallaxCalculator** (`src/systems/ParallaxCalculator.js`) - Distance calculations
- **ObservationSystem** (`src/systems/ObservationSystem.js`) - Historical observation points

### Key Data Structures
```javascript
// CelestialBody representation
{
  name: 'earth',
  radius: 1.0,
  textureUrl: '/textures/earth/earth_day.jpg',
  orbitData: {
    semiMajorAxis: 1.0,
    eccentricity: 0.0167,
    inclination: 0.0,
    // ... orbital elements
  }
}

// ObservationPoint structure
{
  name: 'Stockholm',
  observer: 'Per Wilhelm Wargentin',
  latitude: 59.3293,
  longitude: 18.0686,
  contactTimes: {
    firstContact: '1761-06-06T02:19:00Z',
    secondContact: '1761-06-06T02:39:00Z',
    // ... transit phases
  }
}
```

## Development Workflow

### Adding New Celestial Bodies
1. Create texture in `public/textures/[body-name]/`
2. Extend `CelestialBody` class in `src/objects/`
3. Register in `SceneManager.createScene()`
4. Add orbital data to `public/data/orbital-elements.json`

### Implementing New Features
1. Check existing modules in `src/systems/` for similar functionality
2. Use event system for component communication:
   ```javascript
   // Event patterns
   EventTypes.TIME_CHANGED
   EventTypes.CELESTIAL_BODY_CLICKED
   EventTypes.OBSERVATION_POINT_SELECTED
   ```
3. Follow established patterns for class structure and error handling

### Performance Considerations
- Use LOD (Level of Detail) for distant objects
- Implement texture caching via `TextureManager`
- Monitor FPS with built-in performance counter
- Enable WebGL extensions check on startup

## File Structure

```
src/
├── core/           # Scene, camera, time management
├── objects/        # 3D celestial objects
├── systems/        # Feature-specific modules
├── ui/             # User interface components
├── utils/          # Mathematical and utility functions
├── styles/         # CSS styling
└── main.js         # Application entry point

public/
├── textures/       # NASA texture assets
├── data/          # JSON observation data
└── favicon.ico
```

## Key Configuration Files

- **vite.config.js** - Build configuration, chunk splitting, performance optimizations
- **package.json** - Dependencies: Three.js ^0.160.0, Tween.js ^21.0.0
- **.eslintrc.js** - Code style rules (modern ES6+)
- **.prettierrc** - Code formatting standards

## Browser Compatibility

- **Required**: WebGL 2.0 support
- **Recommended**: Chrome 90+, Firefox 90+, Safari 14+
- **Features**: ES2022+, WebGL extensions check on startup
- **Fallback**: Graceful degradation with user-friendly error messages

## Deployment

### Cloudflare Pages (Primary)
- Auto-deploy from `main` branch
- Build command: `npm run build`
- Output directory: `dist`
- Environment: Node.js 18

### Alternative Platforms
- GitHub Pages: Available via GitHub Actions
- Netlify: `netlify.toml` configuration provided
- Vercel: Compatible with zero-config deployment

## Data Sources

- **Textures**: NASA open data (Blue Marble, SDO images)
- **Orbital Elements**: JPL Horizons system data
- **Historical Data**: 1761 and 1769 Venus transit observations
- **Calculations**: Astronomical algorithms from Meeus' "Astronomical Algorithms"