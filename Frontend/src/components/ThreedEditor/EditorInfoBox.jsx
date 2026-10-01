import React from "react";

export default function EditorInfoBox({ stats }) {
  const displayStats = [
    { label: "Vertex Count", value: stats?.vertexCount || "0" },
    { label: "Polygon Count", value: stats?.polygonCount || "0" },
    { label: "Mesh Count", value: stats?.materialCount || "0" },
    { label: "File Size", value: stats?.fileSize || "0 MB" },
    { label: "Dimensions", value: stats?.dimensions || "0 X 0 X 0 cm" },
  ];
  return (
    <div className="w-full px-[0.21vw] py-[0.21vw] space-y-[0.21vw] p-[0.42vw]">
      {displayStats.map((stat, idx) => (
        <div key={idx} className="flex items-center justify-between ">
          <span className="text-[0.6vw] text-white stroke-black stroke-[0.1vw] font-semibold">
            {stat.label}
          </span>
          <span className="text-[0.6vw] text-white stroke-black stroke-[0.1vw] font-semibold tabular-nums">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
