# Cloudflare Worker Chart Generation API

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

A Cloudflare Worker that generates PNG charts from URL parameters using Chart.js. Easily create visualizations by just constructing a URL.

https://raw.githubusercontent.com/DevAryanPro/Cloudflare-Workers-Chart-API/refs/heads/main/download%20(1).png

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
https://your-worker.workers.dev/plot?data=10,5,8&type=bar&title=Sales&colors=%23ff0000,%2300ff00
```

> Note: When passing hex colors in URLs, replace `#` with `%23`

## API Documentation

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Returns documentation in JSON format |
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
| `colors` | Comma-separated hex colors (use %23 for #) | Default palette | `colors=%23ff0000,%2300ff00` |
| `width` | Image width (max 2000px) | 800 | `width=1200` |
| `height` | Image height (max 2000px) | 600 | `height=800` |
| `bgcolor` | Background color (hex) | `#ffffff` | `bgcolor=%23f0f0f0` |
| `xlabel` | X-axis label (max 30 chars) | "X Axis" | `xlabel=Months` |
| `ylabel` | Y-axis label (max 30 chars) | "Y Axis" | `ylabel=Revenue` |
| `grid` | Show gridlines? (`true`/`false`) | `true` | `grid=false` |

## Examples

### Basic Bar Chart
```bash
/plot?data=10,5,8&type=bar&title=Sales
```

### Pie Chart with Custom Colors
```bash
/plot?data=30,40,30&type=pie&names=Food,Rent,Savings&colors=%23ff6384,%2336a2eb,%23cc65fe
```

### Line Chart Without Grid
```bash
/plot?data=1,2,3,4&type=line&title=Growth&grid=false
```

## Error Handling

The API provides visual error messages when:
- Invalid data is provided (non-numeric values)
- Parameters are malformed
- Image processing fails

Errors are displayed as SVG images with red text on white background.

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
