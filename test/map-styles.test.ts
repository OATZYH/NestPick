import { describe, expect, it } from "bun:test";
import {
  MAP_STYLES,
  EOX_SATELLITE_STYLE,
  SATELLITE_HYBRID_STYLE,
  OUTDOORS_STYLE,
  resolveMapStyle,
} from "@/lib/map-styles";
import type { StyleSpecification } from "maplibre-gl";

describe("MapLibre Style Specifications", () => {
  it("validates EOX Sentinel-2 Cloudless style specification", () => {
    expect(EOX_SATELLITE_STYLE.version).toBe(8);
    expect(EOX_SATELLITE_STYLE.sources).toBeDefined();

    const satelliteSource = EOX_SATELLITE_STYLE.sources["satellite"] as any;
    expect(satelliteSource).toBeDefined();
    expect(satelliteSource.type).toBe("raster");
    expect(Array.isArray(satelliteSource.tiles)).toBe(true);
    expect(satelliteSource.tiles[0]).toContain("tiles.maps.eox.at");

    expect(Array.isArray(EOX_SATELLITE_STYLE.layers)).toBe(true);
    const satelliteLayer = EOX_SATELLITE_STYLE.layers[0];
    expect(satelliteLayer.id).toBe("satellite");
    expect(satelliteLayer.type).toBe("raster");
    expect(satelliteLayer.source).toBe("satellite");
  });

  it("validates ESRI Satellite Hybrid style specification", () => {
    expect(SATELLITE_HYBRID_STYLE.version).toBe(8);
    expect(SATELLITE_HYBRID_STYLE.sources).toBeDefined();

    expect(SATELLITE_HYBRID_STYLE.sources["esri-satellite"]).toBeDefined();
    expect(SATELLITE_HYBRID_STYLE.sources["esri-transportation"]).toBeDefined();
    expect(SATELLITE_HYBRID_STYLE.sources["esri-labels"]).toBeDefined();

    const layers = SATELLITE_HYBRID_STYLE.layers;
    expect(layers.some((l) => l.id === "esri-satellite-layer")).toBe(true);
    expect(layers.some((l) => l.id === "esri-transportation-layer")).toBe(true);
    expect(layers.some((l) => l.id === "esri-labels-layer")).toBe(true);
  });

  it("validates Outdoors / Topo style specification", () => {
    expect(OUTDOORS_STYLE.version).toBe(8);
    expect(OUTDOORS_STYLE.sources["esri-topo"]).toBeDefined();
    expect(OUTDOORS_STYLE.layers.some((l) => l.id === "esri-topo-layer")).toBe(true);
  });

  it("resolves default style based on theme", () => {
    const lightStyle = resolveMapStyle("default", "light");
    const darkStyle = resolveMapStyle("default", "dark");

    expect(lightStyle).toBe(MAP_STYLES.light);
    expect(darkStyle).toBe(MAP_STYLES.dark);
    expect(lightStyle).not.toBe(darkStyle);
  });

  it("resolves named styles correctly", () => {
    expect(resolveMapStyle("streets")).toBe(MAP_STYLES.streets);
    expect(resolveMapStyle("satellite")).toBe(SATELLITE_HYBRID_STYLE);
    expect(resolveMapStyle("satellite-eox")).toBe(EOX_SATELLITE_STYLE);
    expect(resolveMapStyle("outdoors")).toBe(OUTDOORS_STYLE);
  });
});

describe("Map Tile & Style Network Reachability (No 401/403 Errors)", () => {
  it("fetches CartoDB Light style JSON without auth error", async () => {
    const res = await fetch(MAP_STYLES.light as string, { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("fetches CartoDB Dark style JSON without auth error", async () => {
    const res = await fetch(MAP_STYLES.dark as string, { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("fetches CartoDB Streets style JSON without auth error", async () => {
    const res = await fetch(MAP_STYLES.streets as string, { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("fetches EOX Sentinel-2 Cloudless sample tile with HTTP 200", async () => {
    const eoxSource = EOX_SATELLITE_STYLE.sources["satellite"] as any;
    const tileTemplate = eoxSource.tiles[0] as string;
    // Substitute sample tile z=9, x=452, y=207
    const sampleUrl = tileTemplate
      .replace("{z}", "9")
      .replace("{x}", "452")
      .replace("{y}", "207");

    const res = await fetch(sampleUrl, { method: "HEAD" });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeDefined();
  });

  it("fetches ESRI World Imagery satellite tile with HTTP 200", async () => {
    const esriSource = SATELLITE_HYBRID_STYLE.sources["esri-satellite"] as any;
    const tileTemplate = esriSource.tiles[0] as string;
    const sampleUrl = tileTemplate
      .replace("{z}", "12")
      .replace("{x}", "3238")
      .replace("{y}", "1792");

    const res = await fetch(sampleUrl, { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("fetches ESRI Transportation roads overlay tile with HTTP 200", async () => {
    const esriSource = SATELLITE_HYBRID_STYLE.sources["esri-transportation"] as any;
    const tileTemplate = esriSource.tiles[0] as string;
    const sampleUrl = tileTemplate
      .replace("{z}", "12")
      .replace("{x}", "3238")
      .replace("{y}", "1792");

    const res = await fetch(sampleUrl, { method: "HEAD" });
    expect(res.status).toBe(200);
  });

  it("fetches ESRI Topo Map outdoors tile with HTTP 200", async () => {
    const esriSource = OUTDOORS_STYLE.sources["esri-topo"] as any;
    const tileTemplate = esriSource.tiles[0] as string;
    const sampleUrl = tileTemplate
      .replace("{z}", "12")
      .replace("{x}", "3238")
      .replace("{y}", "1792");

    const res = await fetch(sampleUrl, { method: "HEAD" });
    expect(res.status).toBe(200);
  });
});
