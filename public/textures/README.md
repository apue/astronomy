# NASA Textures

This directory contains high-quality texture assets from NASA for the Venus Transit Astronomy project.

## Directory Structure

```
textures/
├── sun/
│   ├── sun_surface.jpg          # Solar surface texture (4096x2048)
│   ├── sun_corona.jpg           # Solar corona texture (2048x1024)
│   └── sun_normal.jpg           # Solar normal map (2048x1024)
├── earth/
│   ├── earth_day.jpg            # Earth day texture (8192x4096)
│   ├── earth_night.jpg          # Earth night lights texture (8192x4096)
│   ├── earth_clouds.jpg         # Earth cloud layer (8192x4096)
│   ├── earth_bump.jpg           # Earth elevation map (8192x4096)
│   ├── earth_normal.jpg         # Earth normal map (8192x4096)
│   └── earth_specular.jpg       # Earth specular map (8192x4096)
├── venus/
│   ├── venus_surface.jpg        # Venus surface texture (4096x2048)
│   ├── venus_clouds.jpg         # Venus cloud layer (4096x2048)
│   ├── venus_normal.jpg         # Venus normal map (2048x1024)
│   └── venus_atmosphere.jpg     # Venus atmosphere texture (2048x1024)
└── stars/
    ├── milky_way.jpg            # Milky Way background (8192x4096)
    ├── star_field.jpg           # Star field texture (4096x4096)
    └── star_alpha.png           # Star alpha channel (4096x4096)
```

## Texture Sources

All textures are sourced from NASA and are in the public domain:

### Sun Textures
- **Solar Dynamics Observatory (SDO)**: High-resolution solar imagery
- **SOHO Mission**: Solar and Heliospheric Observatory data
- **Source**: NASA/GSFC/SDO

### Earth Textures
- **Blue Marble**: NASA's Earth imagery collection
- **Visible Earth**: NASA Earth Observatory
- **Blue Marble Next Generation**: 12-month seasonal composite
- **Source**: NASA Visible Earth

### Venus Textures
- **Magellan Mission**: Radar mapping of Venus surface
- **Pioneer Venus**: Atmospheric data and imagery
- **Source**: NASA/JPL

## Usage Instructions

### Loading Textures
```javascript
import { textureLoader } from '../utils/TextureLoader.js';

// Load individual texture
const sunTexture = await textureLoader.loadTexture('/textures/sun/sun_surface.jpg');

// Load multiple textures
const earthTextures = await textureLoader.loadTextures({
  day: '/textures/earth/earth_day.jpg',
  night: '/textures/earth/earth_night.jpg',
  clouds: '/textures/earth/earth_clouds.jpg'
});
```

### Texture Quality Settings
Textures are available in multiple resolutions:
- **High Quality**: 8192x4096 (for high-end devices)
- **Medium Quality**: 4096x2048 (for medium devices)
- **Low Quality**: 2048x1024 (for low-end devices)

### Performance Optimization
- Use texture compression (DXT, ETC2, ASTC)
- Implement texture streaming for large textures
- Use mipmapping for better performance
- Implement LOD system for texture quality

## License
All NASA textures are in the public domain and can be used freely for educational and commercial purposes.

## Attribution
When using these textures, please attribute:
- **NASA/GSFC/SDO** for solar textures
- **NASA Visible Earth** for Earth textures
- **NASA/JPL** for Venus textures

## Download Instructions
To download the actual texture files:

1. Visit https://visibleearth.nasa.gov
2. Search for "Blue Marble"
3. Download appropriate resolution images
4. Convert to JPG format with 90% quality
5. Place in corresponding directory

For solar textures:
1. Visit https://sdo.gsfc.nasa.gov
2. Access the SDO data archive
3. Download latest solar imagery
4. Convert and resize as needed

For Venus textures:
1. Visit https://photojournal.jpl.nasa.gov
2. Search for "Venus Magellan"
3. Download radar imagery
4. Process and convert as needed