"use client";

import { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Search from "@arcgis/core/widgets/Search";
import Graphic from "@arcgis/core/Graphic";
import esriConfig from "@arcgis/core/config";
import "@arcgis/core/assets/esri/themes/light/main.css"

export default function BarLocatorMap({ bars = [] }) {
    // useRef holds value to stay after rerenders
    const mapDiv = useRef(null);
    const viewRef = useRef(null);
    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        if (!mapDiv.current) return;

        esriConfig.apiKey = process.env.NEXT_PUBLIC_ARCGIS_API_KEY;

        const map = new Map({
            basemap: "arcgis/streets"
        });

        const view = new MapView({
            container: mapDiv.current,
            map: map,
            center: [-117.1825, 34.0556], // Redlands, CA
            zoom: 12,
        });

        const searchWidget = new Search({
            view: view,
        });

        view.ui.add(searchWidget, "top-right");

        const clearButton = document.createElement("button");
        clearButton.innerText = "Clear drive-time area";
        clearButton.className = "esri-widget esri-widget--button";
        clearButton.style.padding = "8px 12px";
        clearButton.style.cursor = "pointer";
        clearButton.onclick = () => {
            view.graphics.removeMany(
                view.graphics.filter((g) => g.attributes?.isServiceArea).toArray()
            );
        };
        view.ui.add(clearButton, "top-left");

        viewRef.current = view;

        return () => {
            if (viewRef.current) {
                viewRef.current.destroy();
                viewRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const view = viewRef.current;
        if (!view || !view.map) return

        view.graphics.removeAll();

        bars.forEach((bar) => {
            const point = {
                type: "point",
                longitude: bar.longitude,
                latitude: bar.latitude,
            };

            const markerSymbol = {
                type: "simple-marker",
                color: [226, 119, 40],
                outline: {
                    color: [255, 255, 255],
                    width: 1,
                },
            };

            const graphic = new Graphic ({
                geometry: point,
                symbol: markerSymbol,
                attributes: bar,
                popupTemplate: {
                    title: "{name}",
                    content: "{address}",
                },
            });

            view.graphics.add(graphic);
        });
    }, [bars]);

    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const clickHandler = view.on("click", async (event) => {
            const response = await view.hitTest(event);
            const graphicHit = response.results.find(
                (result) => result.graphic && result.graphic.attributes?.name
            );

            if(!graphicHit) return;

            setShowHint(false);
            const bar = graphicHit.graphic.attributes;
            await showServiceArea(bar, view);
        });

        return () => {
            clickHandler.remove();
        };
    }, []);

    async function showServiceArea(bar, view) {
        const url = new URL(
            "https://route-api.arcgis.com/arcgis/rest/services/World/ServiceAreas/NAServer/ServiceArea_World/solveServiceArea"
        );

        const facilities = {
            spatialReference: { wkid: 4326 },
            features: [
                {
                    geometry: { x: bar.longitude, y: bar.latitude },
                },
            ],
        };

        url.searchParams.set("f", "json");
        url.searchParams.set("token", esriConfig.apiKey);
        url.searchParams.set("facilities", JSON.stringify(facilities));
        url.searchParams.set("defaultBreaks", "10");
        url.searchParams.set("outSR", "4326");

        const response = await fetch(url);
        const data = await response.json();

        if (!data.saPolygons || !data.saPolygons.features) {
            console.warn("No service area returned", data);
            return;
        }

        view.graphics.removeMany(
            view.graphics.filter((g) => g.attributes?.isServiceArea).toArray()
        );

        data.saPolygons.features.forEach((feature) => {
            const polygonGraphic = new Graphic({
                geometry: {
                    type: "polygon",
                    rings: feature.geometry.rings,
                    spatialReference: { wkid: 4326 },
                },
                symbol: {
                    type: "simple-fill",
                    color: [51, 153, 255, 0.3],
                    outline: {
                        color: [51, 153, 255],
                        width: 2,
                    },
                },
                attributes: { isServiceArea: true },
            });

            view.graphics.add(polygonGraphic);
        });
    }

    return (
        <div style={{ position: "relative", height: "100vh", width: "100%" }}>
            {showHint && (
                <div 
                    style={{
                        position: "absolute",
                        top: 12,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "white",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        zIndex: 10,
                        fontFamily: "sans-serif",
                        fontSize: "14px",
                    }}
                >
                    Click a bar to see its 10-minute drive-time area 
                </div>
            )}
            <div ref={mapDiv} style={{ height: "100%", width: "100%" }} />
        </div>
    );
};