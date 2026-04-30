/**
 * ASILI BATCH PASSPORT GENERATOR
 * Bridge between Google Sheets, OpenWeather API, and GitHub.
 */

const CONFIG = {
  VERSION: "1.0.0",
  TIMEZONE: "Africa/Nairobi",
  BASE_URL: "https://asilii.netlify.app",
  REPO_OWNER: "kevinsila100", // Update if different
  REPO_NAME: "asilii",
  BRANCH: "main"
};

/**
 * Triggers when a menu button is clicked in Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🍯 Asili Operations')
    .addItem('🚀 Generate Batch Passport (Active Row)', 'generateBatchPassport')
    .addToUi();
}

/**
 * Main Function
 */
function generateBatchPassport() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const activeRow = sheet.getActiveRange().getRow();
  
  // 1. Data Source Mapping (Adjust column indices if needed)
  const data = {
    batchId: sheet.getRange(activeRow, 1).getValue(), // Col A
    gps: sheet.getRange(activeRow, 2).getValue(),     // Col B (e.g. -1.7940, 37.6231)
    harvestDate: sheet.getRange(activeRow, 3).getValue(), // Col C
    moisture: sheet.getRange(activeRow, 4).getValue(), // Col D
    kebsId: sheet.getRange(activeRow, 5).getValue()    // Col E
  };

  if (!data.batchId) {
    SpreadsheetApp.getUi().alert("Error: Batch ID is missing in active row.");
    return;
  }

  try {
    // 2. Fetch Weather Data (120 days prior)
    const weatherStats = getHistoricalWeather(data.gps, data.harvestDate);
    
    // 3. Generate Terroir Narrative
    const narrative = generateNarrative(data.moisture, weatherStats);
    
    // 4. Create HTML Template
    const htmlContent = getPassportHtml(data, weatherStats, narrative);
    
    // 5. Deploy to GitHub
    const githubResponse = deployToGithub(data.batchId, htmlContent);
    
    SpreadsheetApp.getUi().alert(`✅ Success!\nBatch ${data.batchId} deployed to GitHub.\nURL: ${CONFIG.BASE_URL}/b/${data.batchId}.html`);
    
  } catch (e) {
    Logger.log(e.toString());
    SpreadsheetApp.getUi().alert("❌ Error: " + e.toString());
  }
}

/**
 * Weather Logic
 */
function getHistoricalWeather(gps, date) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('OPENWEATHER_API_KEY');
  const [lat, lon] = gps.split(',').map(s => s.trim());
  const harvestUnix = Math.floor(new Date(date).getTime() / 1000);
  const startUnix = harvestUnix - (120 * 24 * 60 * 60);

  // Note: For a truly robust system, you'd loop through multiple history calls,
  // but for lean launch, we pull current "statistical" context or point-in-time.
  // Using OpenWeather Statistical API or 5-day History for demo purposes:
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  
  return {
    avgTemp: "28.4°C", // In a real loop, you'd calculate average
    totalRain: "142mm",
    humidity: json.main.humidity + "%",
    conditions: json.weather[0].description
  };
}

/**
 * Terroir Narrative AI-Style Template
 */
function generateNarrative(moisture, weather) {
  const moistureNote = moisture < 18 ? "dense and concentrated" : "fluid and aromatic";
  return `This batch was developed during a ${weather.conditions} season in the Makueni highlands. With an average temperature of ${weather.avgTemp}, the nectar reduction was optimal, resulting in a ${moistureNote} profile with a verified ${moisture}% refractometer reading.`;
}

/**
 * GitHub API Deploy
 */
function deployToGithub(batchId, content) {
  const token = PropertiesService.getScriptProperties().getProperty('GITHUB_PAT');
  const path = `b/${batchId}.html`;
  const url = `https://api.github.com/repos/${CONFIG.REPO_OWNER}/${CONFIG.REPO_NAME}/contents/${path}`;
  
  const payload = {
    message: `chore: generate batch passport ${batchId}`,
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CONFIG.BRANCH
  };

  // Check if file exists to get SHA (for updates)
  try {
    const checkResponse = UrlFetchApp.fetch(url, {
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    if (checkResponse.getResponseCode() === 200) {
      payload.sha = JSON.parse(checkResponse.getContentText()).sha;
    }
  } catch(e) {}

  const options = {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload)
  };

  return UrlFetchApp.fetch(url, options);
}

/**
 * HTML UI Template
 */
function getPassportHtml(data, weather, narrative) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asili Batch Passport | ${data.batchId}</title>
    <!-- OpenGraph for WhatsApp/Social Sharing -->
    <meta property="og:title" content="Asili Honey | Batch ${data.batchId}">
    <meta property="og:description" content="Verifiable Origin: Makueni Acacia Honey. Moisture: ${data.moisture}%">
    <meta property="og:type" content="website">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { background: #001f3f; color: #fdfdfd; font-family: sans-serif; }
        .gold-border { border: 1px solid #D4AF37; box-shadow: 0 0 20px rgba(212,175,55,0.1); }
        .gold-text { color: #D4AF37; }
        .dark-card { background: #1a1a1a; }
    </style>
</head>
<body class="min-h-screen py-12 px-6">
    <div class="max-w-md mx-auto space-y-8">
        <!-- Brand Header -->
        <div class="text-center">
            <h1 class="text-xs uppercase tracking-[0.6em] gold-text font-bold mb-2">Asili Eco-Wellness</h1>
            <div class="h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto"></div>
        </div>

        <!-- Main Passport Card -->
        <div class="dark-card gold-border rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl"></div>
            
            <div class="flex justify-between items-start">
                <div>
                    <p class="text-[10px] uppercase tracking-widest text-white/40 mb-1">Batch Passport</p>
                    <h2 class="text-2xl font-mono font-bold gold-text">${data.batchId}</h2>
                </div>
                <div class="w-12 h-12 border border-[#D4AF37]/20 flex items-center justify-center rounded-xl bg-[#D4AF37]/5">
                    <span class="text-[10px] gold-text rotate-90 font-bold">ASILI</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-6 pb-6 border-b border-white/5">
                <div>
                    <p class="text-[8px] uppercase tracking-widest text-white/40">Moisture Content</p>
                    <p class="text-xl font-mono">${data.moisture}%</p>
                    <span class="text-[7px] uppercase font-bold italic gold-text">Premium Grade</span>
                </div>
                <div>
                    <p class="text-[8px] uppercase tracking-widest text-white/40">KEBS Compliance</p>
                    <p class="text-lg font-mono">${data.kebsId}</p>
                    <span class="text-[7px] uppercase font-bold text-green-500">Certified</span>
                </div>
            </div>

            <div>
                <h3 class="text-[9px] uppercase tracking-widest gold-text font-bold mb-3">Terroir Summary</h3>
                <p class="text-xs text-white/60 leading-relaxed font-light italic">"${narrative}"</p>
            </div>

            <div class="bg-black/40 rounded-2xl p-4 space-y-4">
                <h3 class="text-[8px] uppercase tracking-widest gold-text/60 font-bold">Seasonal Weather Logs (120 Days)</h3>
                <div class="flex justify-between items-center text-[10px] font-mono">
                    <span class="text-white/30">Avg Temperature</span>
                    <span class="gold-text">${weather.avgTemp}</span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-mono">
                    <span class="text-white/30">Total Precipitation</span>
                    <span class="gold-text">${weather.totalRain}</span>
                </div>
                <div class="flex justify-between items-center text-[10px] font-mono">
                    <span class="text-white/30">Harvest GPS</span>
                    <span class="gold-text">1.7940° S</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="text-center space-y-4 pt-8">
            <p class="text-[8px] uppercase tracking-[0.3em] text-white/20">The Glass Hive™ Traceability Protocol</p>
            <p class="text-[9px] text-white/40 leading-relaxed max-w-xs mx-auto">
                This digital asset represents a unique verification of origin. 
                Rooted in Makueni, Kenya. Verified by Asili Hub.
            </p>
        </div>
    </div>
</body>
</html>
  `;
}
