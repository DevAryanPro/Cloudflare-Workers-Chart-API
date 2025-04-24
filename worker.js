// Cloudflare Worker - paste directly into Workers editor
async function generateChartPNG(params) {
    try {
      // Parse and validate data
      const data = params.get('data')?.split(',').map(Number) || [1, 2, 3];
      if (data.some(isNaN)) throw new Error("Invalid data - must be numbers");
  
      // Parse custom names and colors
      const names = params.get('names')?.split(',') || data.map((_, i) => `Item ${i+1}`);
      const colors = params.get('colors')?.split(',').map(c => c.trim()) || ['#36a2eb', '#ff6384', '#4bc0c0'];
  
      // Config with safeguards
      const config = {
        type: ['line', 'bar', 'scatter', 'pie'].includes(params.get('type')) ? params.get('type') : 'bar',
        title: params.get('title')?.slice(0, 50) || 'My Chart', // Limit title length
        width: Math.min(2000, parseInt(params.get('width')) || 800),
        height: Math.min(2000, parseInt(params.get('height')) || 600),
        bgColor: /^#[0-9A-F]{6}$/i.test(params.get('bgcolor')) ? params.get('bgcolor') : '#ffffff',
        showGrid: params.get('grid') !== 'false',
        xlabel: params.get('xlabel')?.slice(0, 30) || 'X Axis', // Limit label length
        ylabel: params.get('ylabel')?.slice(0, 30) || 'Y Axis'
      };
  
      // Generate HTML with Chart.js
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js"></script>
        <style>
          body { margin:0; padding:0; background:${config.bgColor} }
          canvas { display:block; width:${config.width}px; height:${config.height}px }
        </style>
      </head>
      <body>
        <canvas id="chartCanvas"></canvas>
        <script>
          // Prepare datasets
          const datasets = [{
            label: '${config.title}',
            data: ${JSON.stringify(data)},
            backgroundColor: ${JSON.stringify(colors.slice(0, data.length))},
            borderColor: ${JSON.stringify(colors.slice(0, data.length))},
            borderWidth: 1
          }];
  
          // Special handling for pie charts
          ${config.type === 'pie' ? `
            datasets[0].data = ${JSON.stringify(data)};
            datasets[0].backgroundColor = ${JSON.stringify(colors.slice(0, data.length))};
          ` : ''}
  
          // Render chart
          new Chart(
            document.getElementById('chartCanvas'),
            {
              type: '${config.type}',
              data: {
                labels: ${JSON.stringify(names.slice(0, data.length))},
                datasets: datasets
              },
              options: {
                responsive: false,
                plugins: {
                  title: { display: true, text: '${config.title}' },
                  legend: { position: 'right' }
                },
                scales: {
                  x: { 
                    title: { display: true, text: '${config.xlabel}' },
                    grid: { display: ${config.showGrid} }
                  },
                  y: { 
                    title: { display: true, text: '${config.ylabel}' },
                    grid: { display: ${config.showGrid} }
                  }
                }
              }
            }
          );
  
          // Convert to PNG
          setTimeout(() => {
            htmlToImage.toPng(document.body)
              .then(img => {
                fetch('/__worker__/return', {
                  method: 'POST',
                  body: JSON.stringify({ img })
                });
              });
          }, 500);
        </script>
      </body>
      </html>
      `;
  
      return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  
    } catch (err) {
      return new Response(
        `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#fff"/>
          <text x="50%" y="50%" font-family="Arial" font-size="20" fill="red" text-anchor="middle">
            Error: ${err.message.replace(/</g, '&lt;')}
          </text>
        </svg>`,
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
  }
  
  // Handle image return (same as previous version)
  async function handleImageReturn(request) {
    try {
      const { img } = await request.json();
      const binaryStr = atob(img.split(',')[1]);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      return new Response(bytes, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' }
      });
    } catch {
      return new Response(
        '<svg width="800" height="600"><rect width="100%" height="100%" fill="#fff"/>'
        + '<text x="50%" y="50%" font-family="Arial" font-size="20" fill="red" text-anchor="middle">'
        + 'Image Processing Failed</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
  }
  
  // Enhanced API Documentation
  function generateDocs() {
    return JSON.stringify({
      "endpoints": {
        "/": "Documentation",
        "/plot": "Generates PNG chart"
      },
      "required": {
        "data": "Comma-separated numbers (e.g., 10,5)"
      },
      "optional": {
        "type": "line|bar|scatter|pie (default: bar)",
        "title": "Chart title",
        "names": "Comma-separated item names (e.g., Withdraw,Deposit)",
        "colors": "Comma-separated hex colors (e.g., %23ff0000,%2300ff00)",
        "width": "Image width (max: 2000, default: 800)",
        "height": "Image height (max: 2000, default: 600)",
        "bgcolor": "Background hex color (default: %23ffffff)",
        "xlabel": "X-axis label",
        "ylabel": "Y-axis label",
        "grid": "Show grid? (true|false, default: true)"
      },
      "Alert": {
        "Note": "When passing hex colors in URLs, replace # with %23"
      },
      "examples": [
        "/plot?data=10,5&type=bar&title=Transactions&names=Withdraw,Deposit&colors=%23ff0000,%2300ff00",
        "/plot?data=30,40,30&type=pie&names=Food,Rent,Savings&colors=%23ff6384,%2336a2eb,%23cc65fe",
        "/plot?data=1,2,3,4&type=line&title=Growth&grid=false"
      ]
    }, null, 2);
  }
  
  // Main handler (unchanged)
  async function handleRequest(request) {
    const url = new URL(request.url);
    if (url.pathname === '/__worker__/return') return handleImageReturn(request);
    if (url.pathname === '/plot') return generateChartPNG(url.searchParams);
    return new Response(generateDocs(), { headers: { 'Content-Type': 'application/json' } });
  }
  
  addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));
