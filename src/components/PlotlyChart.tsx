import React, { useEffect, useRef, useState, useCallback } from 'react';
import Plot from 'react-plotly.js';
import type { PlotData, Layout, Config } from 'plotly.js';

interface ChartData {
  date: number;
  value: number;
}

interface PlotlyChartProps {
  chartId: string;
  isDarkMode: boolean;
  data?: ChartData[];
  height?: string;
  hoverTemplate?: string;
  xAxisRange?: [string, string] | null;
}

const MAX_POINTS_FOR_TIME_SERIES_CHART = 50000;

function decimateTimeSeries<T extends { date: number }>(data: T[], maxPoints: number): T[] {
  const length = data.length;
  if (length <= maxPoints) return data;

  const stride = Math.ceil(length / maxPoints);
  const result: T[] = [];

  for (let i = 0; i < length; i += stride) {
    result.push(data[i]);
  }

  // Ensure we always include the last point for full range coverage
  if (result[result.length - 1] !== data[length - 1]) {
    result.push(data[length - 1]);
  }

  return result;
}

const PlotlyChart: React.FC<PlotlyChartProps> = ({ chartId, isDarkMode, data, height = '100%', hoverTemplate, xAxisRange }) => {
  const [plotData, setPlotData] = useState<Partial<PlotData>[]>([]);
  const [layout, setLayout] = useState<Partial<Layout>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const plotRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<number | null>(null);
  const [config] = useState<Partial<Config>>({
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    responsive: true,
    // Performance optimizations for large datasets
    plotGlPixelRatio: 2,
    toImageButtonOptions: {
      format: 'png',
      filename: 'chart',
      height: 500,
      width: 700,
      scale: 1
    }
  });

  // Generate sample data if none provided
  const generateData = (): ChartData[] => {
    const data = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    let currentDate = new Date(startDate);
    let value = 100;

    while (currentDate <= endDate) {
      value = Math.round((Math.random() * 10 - 4.8) + value);
      data.push({
        date: currentDate.getTime(),
        value: value
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return data;
  };

  useEffect(() => {
    const processChartData = async () => {
      const rawData = data || generateData();
      const inputLength = rawData.length;

      // Show processing indicator for large datasets
      if (inputLength > 100000) {
        setIsProcessing(true);
        // Allow UI to update before heavy processing
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Performance optimization: Use efficient data structures for large datasets
      let x: (Date | number)[];
      let y: number[];
      const chartData =
        inputLength > MAX_POINTS_FOR_TIME_SERIES_CHART
          ? decimateTimeSeries(rawData, MAX_POINTS_FOR_TIME_SERIES_CHART)
          : rawData;

      if (chartData.length > 100000) {
        // For large datasets, use more efficient data structures
        x = new Array(chartData.length);
        y = new Array(chartData.length); // Use regular array for Plotly compatibility

        for (let i = 0; i < chartData.length; i++) {
          x[i] = chartData[i].date; // Keep as timestamp for better performance
          y[i] = chartData[i].value;
        }
      } else {
        // For smaller datasets, use standard approach
        x = chartData.map(point => new Date(point.date));
        y = chartData.map(point => point.value);
      }

      const trace: Partial<PlotData> = {
        x: x,
        y: y,
        type: 'scattergl', // WebGL for better performance
        mode: 'lines',
        name: 'Time Series Data',
        line: {
          color: isDarkMode ? '#87CEEB' : '#1f77b4',
          width: inputLength > 500000 ? 1 : 2, // Thinner lines for very large datasets
        },
        // Optimize hover for large datasets
        hovertemplate: hoverTemplate ?? '<b>Value:</b> %{y}<extra></extra>',
        // Performance optimizations for large datasets
        ...(chartData.length > 100000 && {
          connectgaps: false,
          simplify: true,
        })
      };

      setPlotData([trace]);
      setIsProcessing(false);

      // Force resize after data is set
      setTimeout(() => {
        if (plotRef.current && plotRef.current.resizeHandler) {
          plotRef.current.resizeHandler();
        }
      }, 100);
    };

    processChartData();
  }, [data, isDarkMode]);

  useEffect(() => {
    const baseXAxis: Partial<Layout['xaxis']> = {
      title: {
        text: 'Date',
        font: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
      },
      type: 'date',
      gridcolor: isDarkMode ? '#444444' : '#e6e6e6',
      tickfont: {
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      showgrid: true,
      zeroline: false,
    };

    const xaxis = xAxisRange
      ? { ...baseXAxis, range: xAxisRange, autorange: false }
      : baseXAxis;

    const newLayout: Partial<Layout> = {
      xaxis,
      yaxis: {
        title: {
          text: 'Value',
          font: {
            color: isDarkMode ? '#ffffff' : '#000000',
          },
        },
        gridcolor: isDarkMode ? '#444444' : '#e6e6e6',
        tickfont: {
          color: isDarkMode ? '#ffffff' : '#000000',
        },
        showgrid: true,
        zeroline: false,
        autorange: true,
        type: 'linear',
      },
      plot_bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
      paper_bgcolor: isDarkMode ? '#1e1e1e' : '#ffffff',
      font: {
        color: isDarkMode ? '#ffffff' : '#000000',
      },
      hovermode: data && data.length > 100000 ? 'closest' : 'x unified',
      showlegend: false,
      margin: {
        l: 80,
        r: 30,
        t: 60,
        b: 80,
      },
      autosize: true,
      // Performance optimizations for large datasets
      ...(data && data.length > 100000 && {
        dragmode: 'pan', // Default to pan for large datasets
        selectdirection: 'h', // Horizontal selection for time series
        // Disable some expensive features for very large datasets
        ...(data.length > 500000 && {
          showspikes: false,
          spikedistance: -1,
        })
      }),
    };

    setLayout(newLayout);

    // Force resize when layout changes
    setTimeout(() => {
      if (plotRef.current && plotRef.current.resizeHandler) {
        plotRef.current.resizeHandler();
      }
    }, 50);
  }, [isDarkMode, data, xAxisRange]);

  // Force resize when container becomes visible
  const handleResize = useCallback(() => {
    if (plotRef.current && plotRef.current.resizeHandler) {
      plotRef.current.resizeHandler();
    }
  }, []);

  // Monitor container dimensions and visibility
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newDimensions = { width: rect.width, height: rect.height };

        if (newDimensions.width > 0 && newDimensions.height > 0) {
          setContainerDimensions(newDimensions);
          setIsChartReady(true);

          // Clear any pending resize timeout
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          // Force resize with a delay
          resizeTimeoutRef.current = window.setTimeout(() => {
            handleResize();
          }, 100);
        }
      }
    };

    const resizeObserver = new ResizeObserver(updateDimensions);
    const mutationObserver = new MutationObserver(updateDimensions);

    resizeObserver.observe(containerRef.current);
    mutationObserver.observe(containerRef.current, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Initial dimension check
    updateDimensions();

    // Fallback check after a delay
    const fallbackTimeout = setTimeout(updateDimensions, 500);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      clearTimeout(fallbackTimeout);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [handleResize]);

  // Force resize when data changes
  useEffect(() => {
    if (data && data.length > 0 && isChartReady) {
      // Multiple resize attempts with increasing delays
      const timeouts = [100, 300, 500, 1000];
      timeouts.forEach(delay => {
        setTimeout(() => {
          handleResize();
          // Also try direct Plotly resize with visibility check
          if (containerRef.current) {
            const plotlyDiv = containerRef.current.querySelector('.plotly-graph-div') as HTMLElement;
            if (plotlyDiv && window.Plotly && plotlyDiv.offsetParent !== null) {
              try {
                window.Plotly.Plots.resize(plotlyDiv);
              } catch (error) {
                // Silently ignore resize errors for hidden elements
              }
            }
          }
        }, delay);
      });
    }
  }, [data, handleResize, isChartReady]);

  return (
    <div
      ref={containerRef}
      id={chartId}
      style={{ width: '100%', height: height, position: 'relative', borderRadius: 'inherit', overflow: 'hidden' }}
    >
      {isProcessing && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          background: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          color: isDarkMode ? '#ffffff' : '#000000',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
        }}>
          Processing {data?.length?.toLocaleString()} data points...
          <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.8 }}>
            This may take a moment for large datasets
          </div>
        </div>
      )}
      {isChartReady && containerDimensions.width > 0 && containerDimensions.height > 0 ? (
        <Plot
          ref={plotRef}
          data={plotData}
          layout={{
            ...layout,
            autosize: true
          }}
          config={config}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
          useResizeHandler={true}
          onInitialized={(_figure, graphDiv) => {
            // Multiple resize attempts with visibility checks
            [50, 150, 300].forEach(delay => {
              setTimeout(() => {
                if (graphDiv && window.Plotly && graphDiv.offsetParent !== null) {
                  try {
                    window.Plotly.Plots.resize(graphDiv);
                  } catch (error) {
                    // Silently ignore resize errors for hidden elements
                  }
                }
              }, delay);
            });
          }}
          onUpdate={(_figure, graphDiv) => {
            // Force resize after update with visibility check
            setTimeout(() => {
              if (graphDiv && window.Plotly && graphDiv.offsetParent !== null) {
                try {
                  window.Plotly.Plots.resize(graphDiv);
                } catch (error) {
                  // Silently ignore resize errors for hidden elements
                }
              }
            }, 50);
          }}
          onRelayout={() => {
            // Handle relayout events
            setTimeout(handleResize, 50);
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDarkMode ? '#8c8c8c' : '#595959',
          fontSize: '14px'
        }}>
          Preparing chart container... ({containerDimensions.width}x{containerDimensions.height})
        </div>
      )}
    </div>
  );
};

export default PlotlyChart;
