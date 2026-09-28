// 1. Handle Main Image Upload
document.getElementById('input-image').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      const displayImg = document.getElementById('display-image');
      displayImg.removeAttribute('crossorigin');
      displayImg.src = event.target.result;
    }
    reader.readAsDataURL(file);
  }
});

// Embedded default India flag (Base64) - 100% reliable across local file:// and web servers
const DEFAULT_FLAG_DATA = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB0AAAASCAYAAACnxdXaAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAALqSURBVEhLtZS/b1tVFMc/5973K36xHTduXCdNSktTWKDAQGGAEdGJAQnBysAP8W8gsbBVAnYGJAQTEhnYgAHRAYREq0iRSpM2KW3s2M6z/Z7tdw9DQlRbEFrhfqYrnaPzPfqec48wBVS/tHc+/2I+SO+eFE9PGLKIgYqGYT7SQiePCpu1t765K4ICiIK0P336I8T8RlTc4NRTTamc3ivd/GX/d2A+bflpp1UsS3/BWLdoHCvCcAl1KwaWVXlM0BVD7k828zeKoGJbuY2vzb7z1WVRRbqfnEut5sH9SQ5RAIuTsQr/A2cCZt5bqxlQUBkrLCgWJ9MUBA68JcZMBh493emKqlicF6NhBY1O4IIyzvjAuGGiqpKsfZDZxjVfk20kH3C4ZEcogtoAiSpQWCCPT3Gr6VE6vUqpfh7iGlqoYsI5MD6KAQTBgY7QtA2dG9DcIH7uzdqBaLeXIgSiIzRrwWAf8hGIoDZEwhLix6gYWu0eG+u3qC/O001SAC48uTzW5HHEMzO1Q3tVAVQ8iKpQOguVVZg7jxSXISgfxDDc2NimXC5w9efr9Pt9ur1souzxdOFwpiL5ZPDfsNbS2G3RbCbkoxzzkPsdH4lOTvoYsmzAhSfO8Orl5ymWZimXZydT/hNRVfn1j/Xk7MmlgpXjl1lR+sOM7368ys1727iCIwsG7LR3udNp0ui2aff3SYcDnDoC61OMCtTLVc5Vl7i4tMrbL71WE4Dg3Ut7hTCaO1NdpF6apxTN4nsezjmy0YBWP6GRtPmz02Cv1zk8oEedHLzHF/4fCY3H7SvfLxyJYmRuMmnaBMayfeWHheP9fAQkJNO9SA+CCioA0fsv7jn0ge0VoBgWhr61t8XYTVHZCq23YzxzLzJBJwrCLPCsJmnP9NJhcchocTgaroryzPWP1y4JwIdff1b/dv2nZxvd9uOqsqJGKy7PPVXNPc8f+OK1w8DbjYNop16ub73+wstbb1x8ZVMe4n/fz1+BOytzs2BsKAAAAABJRU5ErkJggg==";

const displayFlag = document.getElementById('display-flag');
const selectFlag = document.getElementById('select-flag');
const inputFlag = document.getElementById('input-flag');

// Safe Flag URLs from Flagcdn
const flagMap = {
  in: DEFAULT_FLAG_DATA,
  us: 'https://flagcdn.com/w40/us.png',
  gb: 'https://flagcdn.com/w40/gb.png',
  ae: 'https://flagcdn.com/w40/ae.png',
  sa: 'https://flagcdn.com/w40/sa.png',
  ca: 'https://flagcdn.com/w40/ca.png',
  au: 'https://flagcdn.com/w40/au.png',
  de: 'https://flagcdn.com/w40/de.png',
  fr: 'https://flagcdn.com/w40/fr.png',
  jp: 'https://flagcdn.com/w40/jp.png',
  sg: 'https://flagcdn.com/w40/sg.png',
};

// Convert remote flag to Data URL to avoid CORS taint during html2canvas export
function applyFlag(url) {
  if (!url) return;
  displayFlag.style.display = 'inline-block';
  displayFlag.removeAttribute('crossorigin');

  if (url.startsWith('data:')) {
    displayFlag.src = url;
    return;
  }

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onload = e => {
        displayFlag.src = e.target.result;
        displayFlag.removeAttribute('crossorigin');
      };
      reader.readAsDataURL(blob);
    })
    .catch(() => {
      displayFlag.crossOrigin = 'anonymous';
      displayFlag.src = url;
    });
}

// Fallback if flag fails to load
displayFlag.onerror = function() {
  displayFlag.removeAttribute('crossorigin');
  displayFlag.src = DEFAULT_FLAG_DATA;
};

// 2. Handle Country Flag Selector
if (selectFlag) {
  selectFlag.addEventListener('change', function(e) {
    const val = e.target.value;
    if (val === 'none') {
      displayFlag.style.display = 'none';
    } else if (val === 'custom') {
      inputFlag.click();
    } else if (flagMap[val]) {
      applyFlag(flagMap[val]);
    }
  });
}

// 3. Handle Custom Flag Image Upload
if (inputFlag) {
  inputFlag.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        displayFlag.removeAttribute('crossorigin');
        displayFlag.src = event.target.result;
        displayFlag.style.display = 'inline-block';
        if (selectFlag) selectFlag.value = 'custom';
      };
      reader.readAsDataURL(file);
    }
  });
}

// 3. Dynamic Text Updates
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

// 3b. Smart Country Detection from Location Title / Address
const countryKeywords = [
  { keywords: ['india', 'kerala', 'delhi', 'mumbai', 'kochi', 'bangalore', 'bharat'], code: 'in' },
  { keywords: ['united states', 'usa', 'america', 'california', 'new york', 'texas', 'florida', 'washington'], code: 'us' },
  { keywords: ['united kingdom', 'uk', 'london', 'england', 'britain', 'scotland'], code: 'gb' },
  { keywords: ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'sharjah'], code: 'ae' },
  { keywords: ['saudi arabia', 'saudi', 'riyadh', 'jeddah', 'mecca'], code: 'sa' },
  { keywords: ['canada', 'toronto', 'vancouver', 'ontario', 'montreal'], code: 'ca' },
  { keywords: ['australia', 'sydney', 'melbourne', 'brisbane'], code: 'au' },
  { keywords: ['germany', 'berlin', 'munich', 'frankfurt', 'deutschland'], code: 'de' },
  { keywords: ['france', 'paris', 'lyon', 'marseille'], code: 'fr' },
  { keywords: ['japan', 'tokyo', 'osaka', 'kyoto'], code: 'jp' },
  { keywords: ['singapore'], code: 'sg' },
];

const checkAutoFlag = (text) => {
  if (selectFlag && selectFlag.value !== 'custom' && selectFlag.value !== 'none') {
    const lower = text.toLowerCase();
    for (const item of countryKeywords) {
      if (item.keywords.some(k => lower.includes(k))) {
        if (selectFlag.value !== item.code) {
          selectFlag.value = item.code;
          applyFlag(flagMap[item.code]);
        }
        break;
      }
    }
  }
};

const inputTitleEl = document.getElementById('input-title');
if (inputTitleEl) {
  inputTitleEl.addEventListener('input', e => checkAutoFlag(e.target.value));
}
const inputAddressEl = document.getElementById('input-address');
if (inputAddressEl) {
  inputAddressEl.addEventListener('input', e => checkAutoFlag(e.target.value));
}

// 4. Dynamic Coordinates & Smart Map Toggle
const updateCoordsAndMap = () => {
  const lat = document.getElementById('input-lat').value;
  const lng = document.getElementById('input-lng').value;
  
  document.getElementById('display-coords').innerText = `Lat ${lat}° Long ${lng}°`;
  
  const mapImg = document.getElementById('map-img');
  
  if (lat.trim() !== '' && lng.trim() !== '' && !isNaN(lat) && !isNaN(lng)) {
      mapImg.style.display = 'block';
      mapImg.src = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=15&l=sat&size=200,200`;
  } else {
      mapImg.style.display = 'none'; 
  }
};

document.getElementById('input-lat').addEventListener('input', updateCoordsAndMap);
document.getElementById('input-lng').addEventListener('input', updateCoordsAndMap);
updateCoordsAndMap();

// 5. Bulletproof High-Res Download Functionality (Viewport Locked)
function downloadImage() {
  const captureArea = document.getElementById('capture-area');
  const btn = document.querySelector('.btn-download');
  const originalText = btn.innerText;
  
  btn.innerText = "Processing High-Res..."; 
  
  html2canvas(captureArea, { 
    scale: 4, 
    useCORS: true, 
    allowTaint: false,
    width: 540,          // FORCE strict width
    height: 720,         // FORCE strict height
    windowWidth: 540,    // Bypass window scaling bugs
    windowHeight: 720    // Bypass window scaling bugs
  }).then(canvas => {
    const link = document.createElement('a');
    
    link.download = 'Geotagger.png'; 
    link.href = canvas.toDataURL('image/png'); 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    btn.innerText = originalText; 
  }).catch(err => {
    console.error("Export Error:", err);
    alert("Download blocked by browser security. Ensure you are running this on a Local Web Server or HTTPS connection.");
    btn.innerText = originalText; 
  });
}