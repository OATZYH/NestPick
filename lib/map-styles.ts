import type { StyleSpecification } from "maplibre-gl";

/**
 * Sentinel-2 Cloudless Raster Style by EOX IT Services GmbH
 * Demonstrates direct inline MapLibre Style Specification with raster tile endpoint.
 */
export const EOX_SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    satellite: {
      type: "raster",
      tiles: [
        "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
      ],
      tileSize: 256,
      attribution:
        '<a href="https://s2maps.eu" target="_blank">Sentinel-2 cloudless</a> by <a href="https://eox.at" target="_blank">EOX IT Services GmbH</a>',
    },
  },
  layers: [
    {
      id: "satellite",
      type: "raster",
      source: "satellite",
      minzoom: 0,
      maxzoom: 16,
    },
  ],
};

/**
 * High-Resolution Hybrid Satellite Style (ESRI World Imagery + Roads + Places)
 * Sub-meter resolution suitable for condo rooftop & building inspection with street overlays.
 */
export const SATELLITE_HYBRID_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-satellite": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, Maxar, Earthstar Geographics",
    },
    "esri-transportation": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    "esri-labels": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "esri-satellite-layer",
      type: "raster",
      source: "esri-satellite",
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: "esri-transportation-layer",
      type: "raster",
      source: "esri-transportation",
      minzoom: 0,
      maxzoom: 22,
    },
    {
      id: "esri-labels-layer",
      type: "raster",
      source: "esri-labels",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/**
 * Detailed Topographic & Outdoors Style with elevation shading
 */
export const OUTDOORS_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "esri-topo": {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri, HERE, Garmin, Intermap, USGS, METI/NASA, EPA",
    },
  },
  layers: [
    {
      id: "esri-topo-layer",
      type: "raster",
      source: "esri-topo",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

/**
 * Standard Map Styles Registry
 */
export const MAP_STYLES: Record<string, string | StyleSpecification> = {
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  streets: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  outdoors: OUTDOORS_STYLE,
  satellite: SATELLITE_HYBRID_STYLE,
  "satellite-eox": EOX_SATELLITE_STYLE,
};

/**
 * Resolves active style URL or StyleSpecification based on style key and theme
 */
export function resolveMapStyle(
  mapStyle: string,
  theme?: string
): string | StyleSpecification {
  if (mapStyle === "default") {
    return theme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
  }
  return MAP_STYLES[mapStyle] || MAP_STYLES.light;
}
