"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { Skeleton } from "./skeleton";
import { chipConfig, MeterStatus } from "@/utils/getChipColor";
import Chip from "./chip";
import {
  MarkerClusterer,
  SuperClusterAlgorithm,
} from "@googlemaps/markerclusterer";
import { useMeters } from "@/hooks/meters/user-meter-query";

const containerStyle = {
  width: "100%",
  height: "90vh",
};

const center = {
  lat: -34.905,
  lng: -58.038,
};

function Map() {
  const { data, isLoading, isError, error } = useMeters();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey:
      (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) || "",
  });

  const OPTIONS = {
    minZoom: 2,
    maxZoom: 16,
  };

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [activeCluster, setActiveCluster] = useState<{
    position: google.maps.LatLng;
    markers: google.maps.Marker[];
  } | null>(null);
  const [markerCluster, setMarkerCluster] = useState<MarkerClusterer | null>(
    null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(2);

  const markers = useMemo(
    () => data?.filter((item: any) => item.coordinates) || [],
    [data]
  );

  useEffect(() => {
    if (map && markers.length > 0) {
      if (markerCluster) {
        markerCluster.clearMarkers();
      }

      if (zoomLevel < 14) {
        const googleMarkers = markers.map((item: any, index: number) => {
          const status = item.status as MeterStatus;
          const { textColor } = chipConfig[status];

          return new google.maps.Marker({
            position: { lat: item.coordinates.lat, lng: item.coordinates.lng },
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
                  <path fill="${textColor}" stroke="white" stroke-width="2" d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
                </svg>
              `)}`,
              scaledSize: new google.maps.Size(30, 45),
            },
          }) as google.maps.Marker;
        });

        const cluster = new MarkerClusterer({
          markers: googleMarkers,
          map,
          algorithm: new SuperClusterAlgorithm({
            radius: 150,
            minPoints: 2,
          }),
          onClusterClick: (event, cluster) => {
            event.stop();
            const clusterMarkers = cluster.markers as google.maps.Marker[];
            const position = clusterMarkers[0].getPosition()!;
            setActiveCluster({ position, markers: clusterMarkers });
            setActiveMarker(null);
          },
        });

        setMarkerCluster(cluster);
      }
    }
  }, [map, markers, zoomLevel]);

  const onLoad = useCallback((map: google.maps.Map) => {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);

    map.addListener("zoom_changed", () => {
      setZoomLevel(map.getZoom() || 2);
    });
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    if (markerCluster) markerCluster.clearMarkers();
  }, [markerCluster]);

  const handleMarkerClick = (index: number) => {
    setActiveMarker((prev) => (prev === index ? null : index));
    setActiveCluster(null);
  };

  if (isLoading) return <Skeleton className="h-[617px] w-full bg-gray-300" />;
  if (isError) return <p>Error: {error?.message}</p>;

  return isLoaded ? (
    <GoogleMap
      options={OPTIONS}
      mapContainerStyle={containerStyle}
      center={center}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {zoomLevel >= 14 &&
        markers.map((item: any, index: number) => {
          const status = item.status as MeterStatus;
          const { textColor, label } = chipConfig[status];
          return (
            <Marker
              key={index}
              position={{
                lat: item.coordinates.lat,
                lng: item.coordinates.lng,
              }}
              onClick={() => handleMarkerClick(index)}
              icon={{
                url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
                    <path fill="${textColor}"  d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 24 12 24s12-15.6 12-24c0-6.6-5.4-12-12-12zm0 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/>
                  </svg>
                `)}`,
                scaledSize: new google.maps.Size(30, 45),
              }}
            >
              {activeMarker === index && (
                <InfoWindow
                  position={{
                    lat: item.coordinates.lat,
                    lng: item.coordinates.lng,
                  }}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div className="p-2 bg-white rounded shadow-lg flex flex-col justify-start items-start gap-4">
                    <div>
                      <p className="text-balance text-sm text-muted-foreground">
                        Dirección
                      </p>
                      <p className="text-balance text-md text-left">
                        {item.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-balance text-sm text-muted-foreground">
                        Estado
                      </p>
                      <Chip text={label} status={status} />
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}

      {activeCluster && (
        <InfoWindow
          position={activeCluster.position}
          onCloseClick={() => setActiveCluster(null)}
        >
          <div className="p-2 bg-white rounded shadow-lg max-w-xs">
            <h3 className="text-lg font-bold">Información de la zona</h3>
            <p className="text-sm text-gray-600">
              {activeCluster.markers.length} medidores en la zona
            </p>

            <div className="list-disc pl-4 mt-2 text-sm text-gray-800 max-h-64 overflow-y-auto">
              {activeCluster.markers.map((marker, index) => {
                const m = marker as google.maps.Marker;
                const position = m.getPosition();
                const markerData = markers.find(
                  (item: any) =>
                    item.coordinates.lat === position?.lat() &&
                    item.coordinates.lng === position?.lng()
                );
                const { label } = chipConfig[markerData?.status as MeterStatus];

                return (
                  markerData && (
                    <p className="my-4" key={index}>
                      <strong>{markerData.address}</strong> -{" "}
                      <Chip text={label} status={markerData.status} />
                    </p>
                  )
                );
              })}
            </div>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  ) : (
    <Skeleton className="h-[617px] w-full bg-gray-300" />
  );
}

export default React.memo(Map);
