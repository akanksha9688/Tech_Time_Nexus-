import React, { useEffect, useState } from "react";
import { fetchAnalytics } from "../services/analyticsService";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BarElement,
  Title,
} from "chart.js";

import './AnalyticsDashboard.css';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, BarElement, Title);

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics()
      .then((fetchedData) => {
        setData(fetchedData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loader">⏳ Loading analytics...</div>;

  if (!data || !data.created || !data.opened || !data.reminders) {
    return <div className="error">⚠️ No data available. Please try again later.</div>;
  }

  const buildChart = (label, rawData) => {
    const labels = rawData.map(row => row.date);
    const values = rawData.map(row => row.count);

    return {
      labels,
      datasets: [
        {
          label,
          data: values,
          fill: false,
          borderColor: "#4f46e5",
          backgroundColor: "#a5b4fc",
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const chartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => `📅 ${context[0].label}`,
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            if (label === "Created") return `📦 ${value} capsule(s) were created on this day.`;
            if (label === "Opened") return `🔓 ${value} capsule(s) were opened.`;
            if (label === "Reminders") return `⏰ ${value} reminder(s) sent out.`;
            return `${label}: ${value}`;
          },
        },
      },
    },
  };

  // Aggregate daily data into monthly totals
  const aggregateByMonth = (rawData) => {
    const monthMap = {};
    rawData.forEach(row => {
      const month = row.date.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + row.count;
    });

    const months = Object.keys(monthMap).sort();
    const formattedMonths = months.map(m => {
      const [year, month] = m.split('-');
      return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const values = months.map(m => monthMap[m]);

    return { months: formattedMonths, values };
  };

  // For reminders, sum all reminder types per day
  const buildRemindersChart = (rawData) => {
    const labels = rawData.map(row => row.date);
    const values = rawData.map(row => {
      // If row has reminder7, reminder1, openDay, sum them; else fallback to count
      if (typeof row.reminder7 === 'number' || typeof row.reminder1 === 'number' || typeof row.openDay === 'number') {
        return (row.reminder7 || 0) + (row.reminder1 || 0) + (row.openDay || 0);
      }
      return row.count || 0;
    });
    return {
      labels,
      datasets: [
        {
          label: 'Reminders',
          data: values,
          fill: false,
          borderColor: '#f59e42',
          backgroundColor: '#fde68a',
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  // For bar chart, aggregate reminders by month
  const aggregateRemindersByMonth = (rawData) => {
    const monthMap = {};
    rawData.forEach(row => {
      const month = row.date.slice(0, 7);
      const value = (row.reminder7 || 0) + (row.reminder1 || 0) + (row.openDay || 0);
      monthMap[month] = (monthMap[month] || 0) + value;
    });
    const months = Object.keys(monthMap).sort();
    const formattedMonths = months.map(m => {
      const [year, month] = m.split('-');
      return new Date(year, month - 1).toLocaleString('default', { month: 'short', year: 'numeric' });
    });
    const values = months.map(m => monthMap[m]);
    return { months: formattedMonths, values };
  };

  const createdAgg = aggregateByMonth(data.created);
  const openedAgg = aggregateByMonth(data.opened);
  const remindersAgg = aggregateRemindersByMonth(data.reminders);

  const barData = {
    labels: createdAgg.months,
    datasets: [
      {
        label: "Capsules Created",
        data: createdAgg.values,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "Capsules Opened",
        data: openedAgg.values,
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
      {
        label: "Reminders Sent",
        data: remindersAgg.values,
        backgroundColor: "rgba(245, 158, 66, 0.6)",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Capsule Analytics",
      },
      tooltip: {
        callbacks: {
          title: (context) => `📅 ${context[0].label}`,
          label: (context) => {
            const label = context.dataset.label;
            const value = context.raw;
            if (label === "Capsules Created") return `📦 Total created in this month: ${value}`;
            if (label === "Capsules Opened") return `🔓 Total opened in this month: ${value}`;
            return `${label}: ${value}`;
          },
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  };

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">📊 Capsule Analytics</h2>

      <div className="chart-card">
        <h3>Capsules Created</h3>
        <Line data={buildChart("Created", data.created)} options={chartOptions} />
      </div>

      <div className="chart-card">
        <h3>Capsules Opened</h3>
        <Line data={buildChart("Opened", data.opened)} options={chartOptions} />
      </div>

      <div className="chart-card">
        <h3>Reminders Sent</h3>
        <Line data={buildRemindersChart(data.reminders)} options={chartOptions} />
      </div>

      <div className="chart-card">
        <h3>Monthly Summary Bar Chart</h3>
        <Bar data={barData} options={barOptions} />
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
