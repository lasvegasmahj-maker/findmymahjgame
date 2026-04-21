"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const FIPS_TO_ABBR: Record<string, string> = {
  "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT",
  "10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL",
  "18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD",
  "25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE",
  "32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND",
  "39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD",
  "47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV",
  "55":"WI","56":"WY",
};

const ABBR_TO_NAME: Record<string, string> = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",
  CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"Washington DC",FL:"Florida",
  GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",
  MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",
  MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",
  NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
  SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",
  WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",
};

const STATE_CENTERS: Record<string, [number, number]> = {
  AL:[-86.8,32.8],AK:[-153.5,64.2],AZ:[-111.7,34.3],AR:[-92.4,34.8],
  CA:[-119.5,37.2],CO:[-105.5,39.0],CT:[-72.7,41.6],DE:[-75.5,39.0],
  FL:[-81.6,28.7],GA:[-83.4,32.6],HI:[-155.5,20.0],ID:[-114.5,44.4],
  IL:[-89.2,40.0],IN:[-86.2,39.9],IA:[-93.5,42.0],KS:[-98.3,38.5],
  KY:[-85.3,37.8],LA:[-92.0,31.0],ME:[-69.2,45.4],MD:[-76.6,39.0],
  MA:[-71.8,42.3],MI:[-84.7,44.3],MN:[-94.3,46.3],MS:[-89.7,32.7],
  MO:[-92.5,38.4],MT:[-109.6,47.0],NE:[-99.8,41.5],NV:[-116.6,39.3],
  NH:[-71.6,43.7],NJ:[-74.4,40.1],NM:[-106.0,34.4],NY:[-75.5,42.9],
  NC:[-79.4,35.6],ND:[-100.5,47.5],OH:[-82.8,40.4],OK:[-97.5,35.6],
  OR:[-120.5,44.0],PA:[-77.6,41.0],RI:[-71.5,41.7],SC:[-80.9,33.9],
  SD:[-100.2,44.4],TN:[-86.3,35.8],TX:[-99.0,31.5],UT:[-111.7,39.3],
  VT:[-72.6,44.1],VA:[-79.4,37.5],WA:[-120.5,47.4],WV:[-80.6,38.9],
  WI:[-89.8,44.6],WY:[-107.5,43.0],
};

const ACTIVE_STATES = new Set(["NV","FL","TX","NY","CA","IL","AZ","CO","GA","PA","OH","NJ","MA"]);

const STATE_SLUGS: Record<string, string> = {
  NV: "/states/nevada",
  FL: "/states/florida",
};

export default function USMap() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleContainerMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleClick = useCallback((abbr: string) => {
    setSelected(prev => prev === abbr ? null : abbr);
  }, []);

  const selectedName = selected ? ABBR_TO_NAME[selected] : null;
  const hoveredName = hovered ? ABBR_TO_NAME[hovered] : null;
  const stateLink = selected ? STATE_SLUGS[selected] : null;

  return (
    <div className="us-map-container" ref={containerRef} onMouseMove={handleContainerMouseMove}>
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1050 }}
        width={980}
        height={600}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = geo.id;
              const abbr = FIPS_TO_ABBR[fips] || "";
              const isSelected = selected === abbr;
              const isHovered = hovered === abbr;
              const isActive = ACTIVE_STATES.has(abbr);

              let fill = "#dce8fc";
              if (isSelected) fill = "#e91e8c";
              else if (isHovered && isActive) fill = "#b3ccf5";
              else if (isHovered) fill = "#c5d5f5";
              else if (isActive) fill = "#c5d8fc";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHovered(abbr)}
                  onMouseLeave={() => setHovered(null)}
                  onMouseDown={() => handleClick(abbr)}
                  style={{
                    default: {
                      fill,
                      stroke: isSelected ? "#c4168a" : "white",
                      strokeWidth: isSelected ? 1.8 : 0.8,
                      outline: "none",
                      transition: "fill 0.2s ease, stroke 0.2s ease",
                      cursor: "pointer",
                    },
                    hover: {
                      fill: isSelected ? "#e91e8c" : isActive ? "#a8c2f0" : "#baceee",
                      stroke: isSelected ? "#c4168a" : "rgba(26,31,94,0.35)",
                      strokeWidth: isSelected ? 1.8 : 1.2,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "#e91e8c",
                      stroke: "#c4168a",
                      strokeWidth: 1.8,
                      outline: "none",
                      cursor: "pointer",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* State abbreviation labels on each state */}
        {Object.entries(STATE_CENTERS).map(([abbr, coords]) => (
          <Marker key={`label-${abbr}`} coordinates={coords}>
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: ["TX","CA","MT","AK"].includes(abbr) ? 14 : ["HI","RI","CT","DE","NH","VT","MA","NJ","MD"].includes(abbr) ? 8 : 10,
                fill: selected === abbr ? "white" : "rgba(26,31,94,0.55)",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {abbr}
            </text>
          </Marker>
        ))}
      </ComposableMap>

      {/* Floating Tooltip */}
      {hovered && !selected && hoveredName && (
        <div className="map-tooltip" style={{ left: mousePos.x, top: mousePos.y - 52 }}>
          {hoveredName}
          {ACTIVE_STATES.has(hovered) && (
            <span className="map-tooltip-badge">Active</span>
          )}
        </div>
      )}

      {/* State Detail Popup */}
      {selected && selectedName && (
        <div className="state-popup">
          <div className="state-popup-header">
            <div>
              <h3>{selectedName}</h3>
              <p>Players, events &amp; venues</p>
            </div>
            <button className="state-popup-close" onClick={() => setSelected(null)}>&times;</button>
          </div>
          <div className="state-popup-body">
            <div className="state-popup-stats">
              <div><strong>&mdash;</strong><span>Players</span></div>
              <div><strong>&mdash;</strong><span>Events</span></div>
              <div><strong>&mdash;</strong><span>Venues</span></div>
            </div>
            <p className="state-popup-desc">
              {ACTIVE_STATES.has(selected)
                ? `Explore mahjong players, events, and venues in ${selectedName}. Click below to see the full state page.`
                : `Be the first to list yourself in ${selectedName}! Create a free player listing and connect with mahjong players near you.`}
            </p>
            <div className="state-popup-actions">
              {stateLink ? (
                <Link href={stateLink} className="rt-btn" style={{ marginRight: 8 }}>
                  View {selectedName} &rarr;
                </Link>
              ) : (
                <Link href="/#map" className="rt-btn" style={{ marginRight: 8 }}>
                  View {selectedName} &rarr;
                </Link>
              )}
              <Link href="#" className="rt-btn" style={{ background: "var(--navy)" }}>
                Create Listing
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
