/**
 * GEOTAGGER — CORE SCRIPT
 * Charcoal Studio Photography Utility Engine
 */

// Helper to safely load a remote image URL as a base64 Data URL
// Prevents cross-origin canvas tainting during html2canvas export
function urlToDataUrl(url) {
  return new Promise((resolve) => {
    if (!url || url.startsWith('data:')) {
      return resolve(url);
    }
    fetch(url, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Fallback to original URL if fetch fails
        resolve(url);
      });
  });
}

// Helper to update an input and trigger the UI preview sync
function updateAndTrigger(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Helper to update the country flag
function setCountryFlag(countryCode) {
  if (!countryCode) return;
  const flagImg = document.getElementById('display-flag');
  if (!flagImg) return;
  const cleanCode = countryCode.toLowerCase().trim();
  if (cleanCode === 'in') {
    flagImg.src = 'src/flag.png';
    return;
  }
  flagImg.src = `https://flagcdn.com/w40/${cleanCode}.png`;
}

let statusTimeout = null;
function showLocationStatus(message, isSuccess = true) {
  const statusEl = document.getElementById('location-status');
  if (!statusEl) return;

  statusEl.innerText = message;
  statusEl.className = isSuccess ? 'location-status success' : 'location-status error';
  statusEl.style.display = 'flex';

  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    statusEl.style.display = 'none';
  }, 4500);
}

// 1. Search Location via OpenStreetMap Nominatim
async function searchLocation() {
  const query = document.getElementById('input-search').value.trim();
  if (!query) {
    showLocationStatus('Please enter a location to search.', false);
    return;
  }

  const btn = document.getElementById('btn-search');
  const originalText = btn.innerText;
  btn.innerText = 'Searching...';

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1`);
    const data = await res.json();

    if (data && data.length > 0) {
      const place = data[0];
      const lat = parseFloat(place.lat).toFixed(6);
      const lng = parseFloat(place.lon).toFixed(6);

      updateAndTrigger('input-lat', lat);
      updateAndTrigger('input-lng', lng);
      updateAndTrigger('input-address', place.display_name);

      const addr = place.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const state = addr.state || '';
      const country = addr.country || '';

      let title = '';
      if (city && country) {
        title = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
      } else if (city) {
        title = city;
      } else {
        title = country || place.display_name.split(',')[0];
      }
      updateAndTrigger('input-title', title);

      // Auto-update the flag to match detected country
      if (addr.country_code) {
        setCountryFlag(addr.country_code);
      }

      showLocationStatus(`Location locked: ${city || country || 'Coordinates updated'}`);
    } else {
      showLocationStatus('Location not found. Please try more specific terms.', false);
    }
  } catch (err) {
    showLocationStatus('Unable to reach location service.', false);
  } finally {
    btn.innerText = originalText;
  }
}

// 2. Fetch Live Device GPS Location (with Graceful IP Fallback)
function geolocateMe() {
  const btn = document.getElementById('btn-locate');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span>Detecting Location...</span>';

  function applyLocationData(lat, lng, addressData) {
    updateAndTrigger('input-lat', parseFloat(lat).toFixed(6));
    updateAndTrigger('input-lng', parseFloat(lng).toFixed(6));

    if (addressData) {
      updateAndTrigger('input-address', addressData.display_name || '');
      const addr = addressData.address || {};
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
      const state = addr.state || '';
      const country = addr.country || '';

      let title = '';
      if (city && country) {
        title = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
      } else if (city) {
        title = city;
      } else {
        title = country || addressData.display_name.split(',')[0];
      }
      updateAndTrigger('input-title', title);

      if (addr.country_code) {
        setCountryFlag(addr.country_code);
      }
      showLocationStatus(`Location locked: ${title}`);
    } else {
      showLocationStatus(`Coordinates locked: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`);
    }
    btn.innerHTML = originalHtml;
  }

  // Fallback to IP geolocation if GPS is denied or unavailable
  async function fallbackToIp() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${data.latitude}&lon=${data.longitude}&addressdetails=1`);
          const revData = await revRes.json();
          applyLocationData(data.latitude, data.longitude, revData || { display_name: `${data.city}, ${data.region}, ${data.country_name}`, address: { city: data.city, country: data.country_name, country_code: data.country_code } });
        } catch (e) {
          applyLocationData(data.latitude, data.longitude, { display_name: `${data.city}, ${data.region}, ${data.country_name}`, address: { city: data.city, country: data.country_name, country_code: data.country_code } });
        }
        return;
      }
    } catch (e) {
      showLocationStatus('Location unavailable. Please search or pick from map.', false);
    }
    btn.innerHTML = originalHtml;
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
          const data = await res.json();
          applyLocationData(lat, lng, data);
        } catch (e) {
          applyLocationData(lat, lng, null);
        }
      },
      () => {
        // Device GPS denied or timeout -> fallback to IP
        fallbackToIp();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  } else {
    fallbackToIp();
  }
}

// --- INTERACTIVE MAP PICKER ENGINE ---
let pickerMap = null;
let pickerMarker = null;
let currentPickedData = {
  lat: null,
  lng: null,
  address: '',
  title: '',
  countryCode: ''
};

function openMapPicker() {
  const modal = document.getElementById('map-picker-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  let lat = parseFloat(document.getElementById('input-lat').value) || 10.027319;
  let lng = parseFloat(document.getElementById('input-lng').value) || 76.307723;

  setTimeout(() => {
    if (!pickerMap) {
      pickerMap = L.map('interactive-map', {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 15);

      const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri'
      });

      streetLayer.addTo(pickerMap);

      L.control.layers({
        'Street Map': streetLayer,
        'Satellite': satelliteLayer
      }, null, { position: 'topright' }).addTo(pickerMap);

      const pinIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `<div style="width:20px;height:26px;background:#ea4335;border-radius:50% 50% 50% 0;transform:translate(-50%,-100%) rotate(-45deg);box-shadow:0 2px 5px rgba(0,0,0,0.5);"><div style="width:6px;height:6px;background:#7c1208;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>`,
        iconSize: [20, 26],
        iconAnchor: [0, 0]
      });

      pickerMarker = L.marker([lat, lng], {
        draggable: true,
        icon: pinIcon
      }).addTo(pickerMap);

      pickerMarker.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        onPickerPositionChange(pos.lat, pos.lng);
      });

      pickerMap.on('click', function (e) {
        pickerMarker.setLatLng(e.latlng);
        onPickerPositionChange(e.latlng.lat, e.latlng.lng);
      });
    } else {
      pickerMap.invalidateSize();
      pickerMap.setView([lat, lng], 15);
      pickerMarker.setLatLng([lat, lng]);
    }

    onPickerPositionChange(lat, lng);
  }, 100);
}

function closeMapPicker() {
  const modal = document.getElementById('map-picker-modal');
  if (modal) modal.style.display = 'none';
}

let pickerDebounce = null;
function onPickerPositionChange(lat, lng) {
  currentPickedData.lat = parseFloat(lat).toFixed(6);
  currentPickedData.lng = parseFloat(lng).toFixed(6);

  const coordsEl = document.getElementById('modal-picked-coords');
  const addrEl = document.getElementById('modal-picked-address');
  if (coordsEl) coordsEl.innerText = `Lat ${currentPickedData.lat} • Long ${currentPickedData.lng}`;
  if (addrEl) addrEl.innerText = 'Resolving address...';

  clearTimeout(pickerDebounce);
  pickerDebounce = setTimeout(async () => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      const data = await res.json();
      if (data) {
        currentPickedData.address = data.display_name || '';
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
        const state = addr.state || '';
        const country = addr.country || '';

        let title = '';
        if (city && country) {
          title = state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
        } else if (city) {
          title = city;
        } else {
          title = country || data.display_name.split(',')[0];
        }
        currentPickedData.title = title;
        currentPickedData.countryCode = addr.country_code || '';

        if (addrEl) addrEl.innerText = data.display_name || title;
      }
    } catch (e) {
      if (addrEl) addrEl.innerText = 'Address lookup unavailable (coordinates recorded)';
    }
  }, 350);
}

async function searchModalLocation() {
  const query = document.getElementById('modal-map-search').value.trim();
  if (!query) return;

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      if (pickerMap && pickerMarker) {
        pickerMap.setView([lat, lon], 15);
        pickerMarker.setLatLng([lat, lon]);
        onPickerPositionChange(lat, lon);
      }
    }
  } catch (e) {}
}

function confirmMapLocation() {
  if (currentPickedData.lat && currentPickedData.lng) {
    updateAndTrigger('input-lat', currentPickedData.lat);
    updateAndTrigger('input-lng', currentPickedData.lng);

    if (currentPickedData.title) {
      updateAndTrigger('input-title', currentPickedData.title);
    }
    if (currentPickedData.address) {
      updateAndTrigger('input-address', currentPickedData.address);
    }
    if (currentPickedData.countryCode) {
      setCountryFlag(currentPickedData.countryCode);
    }

    showLocationStatus(`Location set from map: ${currentPickedData.title || 'Updated'}`);
    closeMapPicker();
  }
}

// Close map picker when clicking backdrop or pressing Escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMapPicker();
  }
});

const mapModalEl = document.getElementById('map-picker-modal');
if (mapModalEl) {
  mapModalEl.addEventListener('click', (e) => {
    if (e.target === mapModalEl) {
      closeMapPicker();
    }
  });
}

// Enter key to search
document.getElementById('input-search')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchLocation();
  }
});

document.getElementById('modal-map-search')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchModalLocation();
  }
});

// 3. Format Date & Time
function setCurrentTime() {
  const now = new Date();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[now.getDay()];

  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();

  let hours = now.getHours();
  const minutes = pad(now.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = pad(hours % 12 || 12);

  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const offHours = pad(Math.floor(Math.abs(offsetMin) / 60));
  const offMinutes = pad(Math.abs(offsetMin) % 60);
  const tz = `GMT ${sign}${offHours}:${offMinutes}`;

  const formattedStr = `${dayName}, ${day}/${month}/${year} ${hours12}:${minutes} ${ampm} ${tz}`;
  updateAndTrigger('input-time', formattedStr);
}

// 4. Orientation Switcher (Segmented Switch & Select Sync)
function setOrientation(orientation) {
  const captureArea = document.getElementById('capture-area');
  const orientSelect = document.getElementById('input-orientation');
  const btnPortrait = document.getElementById('btn-orient-portrait');
  const btnLandscape = document.getElementById('btn-orient-landscape');

  if (orientation === 'landscape') {
    captureArea.classList.remove('portrait');
    captureArea.classList.add('landscape');
    if (orientSelect) orientSelect.value = 'landscape';
    if (btnPortrait) btnPortrait.classList.remove('active');
    if (btnLandscape) btnLandscape.classList.add('active');
  } else {
    captureArea.classList.remove('landscape');
    captureArea.classList.add('portrait');
    if (orientSelect) orientSelect.value = 'portrait';
    if (btnLandscape) btnLandscape.classList.remove('active');
    if (btnPortrait) btnPortrait.classList.add('active');
  }
}

// Handle select element change (for backward compatibility)
const orientSelectEl = document.getElementById('input-orientation');
if (orientSelectEl) {
  orientSelectEl.addEventListener('change', function (e) {
    setOrientation(e.target.value);
  });
}

// 5. Handle Main Image Upload (with Smart Auto-Orientation)
document.getElementById('input-image').addEventListener('change', function (e) {
  const file = e.target.files && e.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showLocationStatus('Please upload a valid image file.', false);
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const isLandscape = img.width > img.height;
        setOrientation(isLandscape ? 'landscape' : 'portrait');
        document.getElementById('display-image').src = event.target.result;
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 6. Handle Image Fit Toggle (Cover vs Contain)
document.getElementById('input-fit').addEventListener('change', function (e) {
  document.getElementById('display-image').style.objectFit = e.target.value;
});

// 7. Handle Custom Flag Upload
document.getElementById('input-flag').addEventListener('change', function (e) {
  const file = e.target.files && e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById('display-flag').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// 8. Dynamic Text Synchronization
const syncText = (inputId, displayId) => {
  const inputEl = document.getElementById(inputId);
  const displayEl = document.getElementById(displayId);
  if (inputEl && displayEl) {
    inputEl.addEventListener('input', function (e) {
      displayEl.innerText = e.target.value;
    });
  }
};

syncText('input-title', 'display-title');
syncText('input-address', 'display-address');
syncText('input-time', 'display-time');

// 9. Dynamic Coordinates & Satellite Map Preview (Debounced)
let coordsMapDebounce = null;
function getSatelliteTileUrl(lat, lng, zoom = 15) {
  const nLat = parseFloat(lat);
  const nLng = parseFloat(lng);
  if (isNaN(nLat) || isNaN(nLng)) return '';
  const x = Math.floor((nLng + 180) / 360 * Math.pow(2, zoom));
  const y = Math.floor((1 - Math.log(Math.tan(nLat * Math.PI / 180) + 1 / Math.cos(nLat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;
}

function updateCoordsAndMap() {
  const lat = document.getElementById('input-lat').value.trim();
  const lng = document.getElementById('input-lng').value.trim();

  document.getElementById('display-coords').innerText = `Lat ${lat}° Long ${lng}°`;

  clearTimeout(coordsMapDebounce);
  coordsMapDebounce = setTimeout(() => {
    const mapImg = document.getElementById('map-img');
    if (lat !== '' && lng !== '' && !isNaN(lat) && !isNaN(lng)) {
      mapImg.style.display = 'block';
      const mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=sat&size=200,200`;
      mapImg.onerror = function () {
        const fallback = getSatelliteTileUrl(lat, lng);
        if (fallback && mapImg.src !== fallback) {
          mapImg.src = fallback;
        }
      };
      mapImg.src = mapUrl;
    } else {
      mapImg.style.display = 'none';
    }
  }, 200);
}

document.getElementById('input-lat').addEventListener('input', updateCoordsAndMap);
document.getElementById('input-lng').addEventListener('input', updateCoordsAndMap);

// 10. Reliable High-Resolution Image Export
async function downloadImage() {
  const captureArea = document.getElementById('capture-area');
  const btn = document.getElementById('btn-download');
  const originalText = btn.innerText;

  btn.innerText = 'Processing Image...';
  btn.disabled = true;

  try {
    // Pre-convert remote map and flag images to local Data URLs to prevent canvas tainting
    const mapImg = document.getElementById('map-img');
    if (mapImg && mapImg.src && !mapImg.src.startsWith('data:')) {
      mapImg.src = await urlToDataUrl(mapImg.src);
    }

    const flagImg = document.getElementById('display-flag');
    if (flagImg && flagImg.src && !flagImg.src.startsWith('data:')) {
      flagImg.src = await urlToDataUrl(flagImg.src);
    }

    const isLandscape = captureArea.classList.contains('landscape');
    const exportWidth = isLandscape ? 720 : 540;
    const exportHeight = isLandscape ? 540 : 720;

    const canvas = await html2canvas(captureArea, {
      scale: 3, // High-resolution output (1620x2160 or 2160x1620)
      useCORS: true,
      allowTaint: true,
      width: exportWidth,
      height: exportHeight,
      windowWidth: 1440, // Render at desktop width to avoid responsive downscaling
      windowHeight: 1200,
      scrollX: 0,
      scrollY: 0,
      backgroundColor: null
    });

    const link = document.createElement('a');
    const titleVal = document.getElementById('input-title').value.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20) || 'GeoTagger';
    link.download = `GeoTagger_${titleVal}.png`;
    link.href = canvas.toDataURL('image/png');

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Export Error:', err);
    showLocationStatus('Image export failed. Check browser permissions.', false);
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  updateCoordsAndMap();
});