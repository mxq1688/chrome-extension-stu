// Simple script to create Vue-themed PNG icons
const fs = require('fs');

// Basic PNG headers and data for different sizes
const createSimpleIcon = (size) => {
  // Create a simple green square with white 'V' for Vue
  const width = size;
  const height = size;
  
  console.log(`Creating ${size}x${size} icon...`);
  
  // For now, let's create a simple HTML canvas approach
  const html = `
<!DOCTYPE html>
<html>
<head><title>Icon Generator</title></head>
<body>
  <canvas id="canvas" width="${width}" height="${height}"></canvas>
  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    // Background circle
    ctx.fillStyle = '#41B883'; // Vue green
    ctx.beginPath();
    ctx.arc(${width/2}, ${height/2}, ${width/2 - 2}, 0, 2 * Math.PI);
    ctx.fill();
    
    // White border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // White 'V' shape
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold ${Math.floor(size * 0.6)}px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('V', ${width/2}, ${height/2});
    
    console.log('Icon created for size ${size}');
  </script>
</body>
</html>`;
  
  return html;
};

// Generate HTML files for each size
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
  const html = createSimpleIcon(size);
  fs.writeFileSync(`public/icons/icon${size}.html`, html);
  console.log(`Generated icon${size}.html`);
});

console.log('All icon templates created!');