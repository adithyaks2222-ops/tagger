// 1. Handle Image Upload
document.getElementById('input-image').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      document.getElementById('display-image').src = event.target.result;
    }
    reader.readAsDataURL(file);
  }
});

// 2. Dynamic Text Updates
const updateText = (inputId, displayId) => {
  document.getElementById(inputId).addEventListener('input', function(e) {
    document.getElementById(displayId).innerText = e.target.value;
  });
};

updateText('input-title', 'display-title');
updateText('input-address', 'display-address');
updateText('input-time', 'display-time');

// 3. Dynamic Coordinates & Mini-Map update targeting the <img> tag
const updateCoordsAndMap = () => {
  const lat = document.getElementById('input-lat').value;
  const lng = document.getElementById('input-lng').value;
  
  document.getElementById('display-coords').innerText = `Lat ${lat}° Long ${lng}°`;
  
  // Update image source directly
  const mapImg = document.getElementById('map-img');
  mapImg.src = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=sat&size=200,200`;
};

document.getElementById('input-lat').addEventListener('input', updateCoordsAndMap);
document.getElementById('input-lng').addEventListener('input', updateCoordsAndMap);

// 4. Download Functionality
function downloadImage() {
  const captureArea = document.getElementById('capture-area');
  const btn = document.querySelector('.btn-download');
  
  // Temporary button text to show it's working
  btn.innerText = "Processing..."; 
  
  html2canvas(captureArea, { 
    scale: 2, 
    useCORS: true, 
    allowTaint: false 
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'Geotagger.jpg'; 
    link.href = canvas.toDataURL('image/jpeg', 0.9);
    
    // Append, click, and remove (Bulletproof method)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    btn.innerText = "Download Final Image"; 
  }).catch(err => {
    console.error(err);
    alert("Download blocked by browser security. If you are opening this file directly from your computer, you must use a Local Web Server (like VS Code 'Live Server') to allow local images to be downloaded.");
    btn.innerText = "Download Final Image"; 
  });
}