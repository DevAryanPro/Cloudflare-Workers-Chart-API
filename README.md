# Cloudflare Worker Chart Generation API

![Chart Example](https://via.placeholder.com/800x400?text=Sample+Chart+Output)

A Cloudflare Worker that generates PNG charts from URL parameters using Chart.js. Easily create visualizations by just constructing a URL.

## Features

- Generate charts directly from URL parameters
- Support for multiple chart types (bar, line, scatter, pie)
- Customizable colors, labels, and dimensions
- Lightweight and fast (runs on Cloudflare's edge network)
- Error handling with visual feedback

## Quick Start

1. Deploy this code to a Cloudflare Worker
2. Access the API via URL parameters:

```bash
https://your-worker.workers.dev/plot?data=10,5,8&type=bar&title=Sales
```

## API Documentation

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Returns this documentation in JSON format |
| `/plot` | Generates a PNG chart based on URL parameters |

### Parameters

#### Required Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `data` | Comma-separated numbers | `10,5,8` |

#### Optional Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `type` | Chart type (`line`, `bar`, `scatter`, `pie`) | `bar` | `type=pie` |
| `title` | Chart title (max 50 chars) | "My Chart" | `title=Sales+Report` |
| `names` | Comma-separated item names | "Item 1", "Item 2"... | `names=Jan,Feb,Mar` |
| `colors` | Comma-separated hex colors | Default palette | `colors=#ff0000,#00ff00` |
| `width` | Image width (max 2000px) | 800 | `width=1200` |
| `height` | Image height (max 2000px) | 600 | `height=800` |
| `bgcolor` | Background color (hex) | `#ffffff` | `bgcolor=#f0f0f0` |
| `xlabel` | X-axis label (max 30 chars) | "X Axis" | `xlabel=Months` |
| `ylabel` | Y-axis label (max 30 chars) | "Y Axis" | `ylabel=Revenue` |
| `grid` | Show gridlines? (`true`/`false`) | `true` | `grid=false` |

## Examples

### Basic Bar Chart
```
/plot?data=10,5,8&type=bar&title=Sales
```

### Pie Chart with Custom Colors
```
/plot?data=30,40,30&type=pie&names=Food,Rent,Savings&colors=#ff6384,#36a2eb,#cc65fe
```

### Line Chart Without Grid
```
/plot?data=1,2,3,4&type=line&title=Growth&grid=false
```

## Error Handling

The API provides visual error messages when:
- Invalid data is provided (non-numeric values)
- Parameters are malformed
- Image processing fails

Errors are displayed as SVG images with red text on white background.

## Implementation Details

```javascript
// Cloudflare Worker - paste directly into Workers editor
async function generateChartPNG(params) {
  try {
    // Parse and validate data
    const data = params.get('data')?.split(',').map(Number) || [1, 2, 3];
    if (data.some(isNaN)) throw new Error("Invalid data - must be numbers");

    // Parse custom names and colors
    const names = params.get('names')?.split(',') || data.map((_, i) => `Item ${i+1}`);
    const colors = params.get('colors')?.split(',') || ['#36a2eb', '#ff6384', '#4bc0c0'];

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
          Error: ${err.message.replace(/</g, '<')}
        </text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Handle image return
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

// Main handler
async function handleRequest(request) {
  const url = new URL(request.url);
  if (url.pathname === '/__worker__/return') return handleImageReturn(request);
  if (url.pathname === '/plot') return generateChartPNG(url.searchParams);
  return new Response(generateDocs(), { headers: { 'Content-Type': 'application/json' } });
}

addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));
```

## License

MIT License

Copyright (c) 2025 @Kaiiddo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support & Reporting Issues

For support and bug reports, please contact:
- Developer: [@Kaiiddo on Telegram](https://telegram.me/kaiiddo)
- Discussion Group: [https://t.me/DiscussionxGroup](https://t.me/DiscussionxGroup)
