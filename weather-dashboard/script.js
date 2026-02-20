// Open-Meteo Geocoding API
const GEO_API_URL = "https://geocoding-api.open-meteo.com/v1/search";
// Open-Meteo Weather API
const WEATHER_API_URL = "https://api.open-meteo.com/v1/forecast";

// DOM Elements
const form = document.getElementById('search-form');
const cityInput = document.getElementById('city-input');
const errorMsg = document.getElementById('error-message');
const loader = document.getElementById('loader');
const dashboard = document.getElementById('dashboard');

// Current Weather Elements
const elCityName = document.getElementById('city-name');
const elDate = document.getElementById('current-date');
const elIcon = document.getElementById('current-icon');
const elTemp = document.getElementById('current-temp');
const elCondition = document.getElementById('current-condition');
const elHumidity = document.getElementById('current-humidity');
const elWind = document.getElementById('current-wind');

// Forecast Elements
const elForecastList = document.getElementById('forecast-list');

// --- WMO Weather Interpretation Codes ---
// https://open-meteo.com/en/docs
const weatherCodes = {
    0: { condition: "Clear sky", icon: "bx-sun", theme: "theme-sunny" },
    1: { condition: "Mainly clear", icon: "bx-cloud-sun", theme: "theme-sunny" },
    2: { condition: "Partly cloudy", icon: "bx-cloud", theme: "theme-cloudy" },
    3: { condition: "Overcast", icon: "bx-cloud", theme: "theme-cloudy" },
    45: { condition: "Fog", icon: "bx-water", theme: "theme-cloudy" },
    48: { condition: "Depositing rime fog", icon: "bx-water", theme: "theme-cloudy" },
    51: { condition: "Light drizzle", icon: "bx-cloud-drizzle", theme: "theme-rainy" },
    53: { condition: "Moderate drizzle", icon: "bx-cloud-drizzle", theme: "theme-rainy" },
    55: { condition: "Dense drizzle", icon: "bx-cloud-drizzle", theme: "theme-rainy" },
    61: { condition: "Slight rain", icon: "bx-cloud-rain", theme: "theme-rainy" },
    63: { condition: "Moderate rain", icon: "bx-cloud-rain", theme: "theme-rainy" },
    65: { condition: "Heavy rain", icon: "bx-cloud-lightning", theme: "theme-rainy" },
    71: { condition: "Slight snow fall", icon: "bx-cloud-snow", theme: "theme-snowy" },
    73: { condition: "Moderate snow fall", icon: "bx-cloud-snow", theme: "theme-snowy" },
    75: { condition: "Heavy snow fall", icon: "bx-cloud-snow", theme: "theme-snowy" },
    77: { condition: "Snow grains", icon: "bx-cloud-snow", theme: "theme-snowy" },
    80: { condition: "Slight rain showers", icon: "bx-cloud-rain", theme: "theme-rainy" },
    81: { condition: "Moderate rain showers", icon: "bx-cloud-rain", theme: "theme-rainy" },
    82: { condition: "Violent rain showers", icon: "bx-cloud-lightning", theme: "theme-rainy" },
    85: { condition: "Slight snow showers", icon: "bx-cloud-snow", theme: "theme-snowy" },
    86: { condition: "Heavy snow showers", icon: "bx-cloud-snow", theme: "theme-snowy" },
    95: { condition: "Thunderstorm", icon: "bx-cloud-lightning", theme: "theme-night" },
    96: { condition: "Thunderstorm with slight hail", icon: "bx-cloud-lightning", theme: "theme-night" },
    99: { condition: "Thunderstorm with heavy hail", icon: "bx-cloud-lightning", theme: "theme-night" }
};

function getWeatherInfo(code) {
    return weatherCodes[code] || { condition: "Unknown", icon: "bx-help-circle", theme: "theme-cloudy" };
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
    // Default city: Tokyo
    fetchWeatherData("Tokyo");
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

async function fetchWeatherData(city) {
    try {
        errorMsg.classList.add('hidden');
        dashboard.classList.add('loading');
        // loader.classList.remove('hidden'); // スピナーを表示したい場合はコメントアウト解除

        // 1. Get Coordinates from City Name
        const geoRes = await fetch(`${GEO_API_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country_code } = location;

        // 2. Get Weather Data from Coordinates
        // Requires current_weather, daily forecast, and hourly relative humidity
        const weatherRes = await fetch(`${WEATHER_API_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weatherData = await weatherRes.json();

        // 3. Update UI
        updateUI(name, country_code, weatherData);

    } catch (error) {
        console.error("Error fetching weather:", error);
        errorMsg.classList.remove('hidden');
        errorMsg.textContent = "Could not find weather data for that city.";
    } finally {
        dashboard.classList.remove('loading');
        // loader.classList.add('hidden');
    }
}

function updateUI(city, countryCode, data) {
    const { current_weather, daily, hourly } = data;
    const { temperature, windspeed, weathercode, time } = current_weather;

    // Get humidity (closest hour)
    // Find index of current time in hourly array (simplified)
    const currentHourIndex = hourly.time.findIndex(t => t.startsWith(time.substring(0, 13)));
    const humidity = currentHourIndex !== -1 ? hourly.relativehumidity_2m[currentHourIndex] : '--';

    const info = getWeatherInfo(weathercode);

    // Dynamic Theme Update
    setTheme(info.theme);

    // Setup Current Section
    elCityName.textContent = `${city}, ${countryCode}`;

    // Format Date
    const today = new Date(time);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    elDate.textContent = today.toLocaleDateString('en-US', options);

    elTemp.textContent = Math.round(temperature);
    elCondition.textContent = info.condition;
    elIcon.innerHTML = `<i class='bx ${info.icon}' ></i>`;

    elHumidity.textContent = `${humidity}%`;
    elWind.textContent = `${windspeed} km/h`;

    // Setup Forecast Section (7 days)
    elForecastList.innerHTML = '';

    for (let i = 0; i < 7; i++) {
        const dateStr = daily.time[i];
        const wCode = daily.weathercode[i];
        const tMax = Math.round(daily.temperature_2m_max[i]);
        const tMin = Math.round(daily.temperature_2m_min[i]);

        const fInfo = getWeatherInfo(wCode);
        const fDate = new Date(dateStr);
        // Show "Today" for the first item, otherwise the short weekday name
        const dayName = i === 0 ? 'Today' : fDate.toLocaleDateString('en-US', { weekday: 'short' });

        const itemHTML = `
            <div class="forecast-item">
                <div class="f-day">${dayName}</div>
                <div class="f-desc">
                    <i class='bx ${fInfo.icon} f-icon'></i>
                    <!-- <span class="f-cond" style="font-size:0.8rem">${fInfo.condition}</span> -->
                </div>
                <div class="f-temps">
                    <span class="t-max">${tMax}°</span>
                    <span class="t-min">${tMin}°</span>
                </div>
            </div>
        `;
        elForecastList.insertAdjacentHTML('beforeend', itemHTML);
    }
}

function setTheme(themeClass) {
    // 既存のtheme-*クラスを削除して新しいものを追加
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '');
    document.body.classList.add(themeClass);
}
