"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const BarLocatorMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
});

export default function Home() {
  const [bars, setBars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bars")
      .then((res) => res.json())
      .then((data) => {
        setBars(data);
        setLoading(false);
  }); 
}, []);

  return (
    <main style={{ position: "relative" }}>
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.8)",
            zIndex: 10,
            fontFamily: "sans-serif",
          }}
        >
          Loading Bars...
        </div>
      )}
      <BarLocatorMap bars={bars} />
    </main>
  );
}