import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: "#0f172a",
      titleColor: "#f8fafc",
      bodyColor: "#94a3b8",
      borderColor: "#334155",
      borderWidth: 1,
      padding: 8,
      callbacks: {
        label: (context) => ` ${context.label}: ₹${Number(context.raw || 0).toLocaleString('en-IN')}`
      }
    }
  },
  cutout: "68%"
};

export function DoughnutChart({ data, options = {} }) {
  if (!data || !data.datasets || !data.datasets.length) return null;
  const mergedOptions = { ...defaultOptions, ...options };
  return (
    <div style={{ height: "130px", width: "100%", position: "relative", margin: "4px 0" }}>
      <Doughnut data={data} options={mergedOptions} />
    </div>
  );
}