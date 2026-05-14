import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

interface Props {
  latitude: number;
  longitude: number;
  suburb?: string | null;
  /** approximate radius circle in km — shown as visual hint only */
  radiusKm?: number;
  height?: string;
}

export function JobMap({ latitude, longitude, suburb, height = "220px" }: Props) {
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom: 13,
  });

  const onMove = useCallback(({ viewState: vs }: { viewState: typeof viewState }) => {
    setViewState(vs);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        style={{ height }}
        className="w-full rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center"
      >
        <div className="text-center text-white/30 text-xs">
          <MapPin className="h-5 w-5 mx-auto mb-1 text-white/20" />
          {suburb ?? "Location on map"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-white/8">
      <Map
        {...viewState}
        onMove={onMove}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <div className="flex flex-col items-center">
            <div className="bg-primary rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-primary/40 border-2 border-white">
              <MapPin className="h-4 w-4 text-black" />
            </div>
            {suburb && (
              <span className="mt-1 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded-md whitespace-nowrap">
                {suburb}
              </span>
            )}
          </div>
        </Marker>
      </Map>
    </div>
  );
}

/** Fuzzy pin — offsets coords slightly to avoid showing exact address */
export function JobMapFuzzy({ latitude, longitude, suburb, height }: Props) {
  const fuzz = 0.003; // ~300m offset
  return (
    <JobMap
      latitude={latitude + (Math.random() - 0.5) * fuzz}
      longitude={longitude + (Math.random() - 0.5) * fuzz}
      suburb={suburb}
      height={height}
    />
  );
}
