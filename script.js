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
  const inputEl = document.getElementById(inputId);
  if(inputEl) {
      inputEl.addEventListener('input', function(e) {
        document.getElementById(displayId).innerText = e.target.value;
      });
  }
};

updateText('input-title', 'display-title');
updateText('input-address', 'display-address');
updateText('input-time', 'display-time');

// 3. Dynamic Coordinates & Smart Map Toggle
const updateCoordsAndMap = () => {
  const lat = document.getElementById('input-lat').value;
  const lng = document.getElementById('input-lng').value;
  
  // Updates the text display exactly as typed
  document.getElementById('display-coords').innerText = `Lat ${lat}° Long ${lng}°`;
  
  const mapImg = document.getElementById('map-img');
  
  // SMART CHECK: Only load the map if Lat and Lng are actual numbers
  if (lat.trim() !== '' && lng.trim() !== '' && !isNaN(lat) && !isNaN(lng)) {
      mapImg.style.display = 'block';
      mapImg.src = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=sat&size=200,200`;
  } else {
      // Hides the image to reveal the clean dark background if coordinates are missing/invalid
      mapImg.style.display = 'none'; 
  }
};

// Listeners for coordinates
document.getElementById('input-lat').addEventListener('input', updateCoordsAndMap);
document.getElementById('input-lng').addEventListener('input', updateCoordsAndMap);

// Run once on load to set the initial placeholder state
updateCoordsAndMap();

// 4. Bulletproof High-Res Download Functionality
function downloadImage() {
  const captureArea = document.getElementById('capture-area');
  const btn = document.querySelector('.btn-download');
  const originalText = btn.innerText;
  
  // Show loading state
  btn.innerText = "Processing High-Res..."; 
  
  html2canvas(captureArea, { 
    scale: 4, // 4x Ultra-HD resolution prevents any blurring
    useCORS: true, 
    allowTaint: false 
  }).then(canvas => {
    const link = document.createElement('a');
    
    // PNG for ZERO compression loss
    link.download = 'Geotagger.png'; 
    link.href = canvas.toDataURL('image/png'); 
    
    // Append to body, click, and remove (safest method for all browsers)
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Restore button text
    btn.innerText = originalText; 
  }).catch(err => {
    console.error("Export Error:", err);
    alert("Download blocked by browser security. Ensure you are running this on a Local Web Server or HTTPS connection.");
    btn.innerText = originalText; 
  });
}