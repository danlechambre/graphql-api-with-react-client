import "./App.css";
import { useQuery, gql } from "@apollo/client";
import React, { useEffect, useRef, useState } from "react";
import * as Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const GET_DATA = gql`
  query GetData {
    energyData {
      timestamp
      consumption
    }
    energyDataAnomalies {
      timestamp
      consumption
    }
    weatherData {
      date
      averageTemperature
    }
  }
`;

function Chart() {
  const { loading, error, data } = useQuery(GET_DATA);
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);

  const [chartOptions, setChartOptions] = useState<Highcharts.Options>({
    title: {
      text: "Energy Consumption",
      align: "left",
    },
    subtitle: {
      text: "Half-hourly energy consumption against temperature",
      align: "left",
    },
    xAxis: {
      type: "datetime",
    },
    yAxis: [
      {
        title: {
          text: "Energy consumption",
        },
      },
      {
        title: {
          text: "Temperature",
        },
        labels: {
          formatter: function () {
            return this.value + "\xb0C";
          },
        },
        opposite: true,
      },
    ],
    tooltip: {
      shared: true,
    },
  });

  useEffect(() => {
    if (data) {
      const consumption = data.energyData.map((val: any) => ({
        x: val.timestamp,
        y: val.consumption,
      }));
      const consumptionAnomalies = data.energyDataAnomalies.map((val: any) => ({
        x: val.timestamp,
        y: val.consumption,
      }));
      const temp = data.weatherData.map((val: any) => ({
        x: val.date,
        y: val.averageTemperature,
      }));

      setChartOptions((prevState) => ({
        ...prevState,
        series: [
          {
            name: "Energy consumption",
            yAxis: 0,
            type: "line",
            data: [...(consumption ?? [])],
          },
          {
            name: "Anomalies",
            yAxis: 0,
            type: "line",
            opacity: 0,
            data: [...(consumptionAnomalies ?? [])],
          },
          {
            name: "Avg. temp",
            yAxis: 1,
            type: "line",
            data: [...(temp ?? [])],
          },
        ],
      }));
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={chartOptions}
      ref={chartComponentRef}
    />
  );
}

function App() {
  return (
    <div className="chart-container">
      <Chart />
    </div>
  );
}

export default App;
