

// beräkna frakt baserat på distans (km)
function calculateShipping(distanceKm, baseFee, baseKm, perKmFee) {
    // säkerställ numeriska värden
    distanceKm = Number(distanceKm) || 0;
    baseFee = Number(baseFee) || 0;
    baseKm = Number(baseKm) || 0;
    perKmFee = Number(perKmFee) || 0;

    if (distanceKm <= baseKm) {
        return {
            total: roundToTwo(baseFee),
            breakdown: `Fast avgift (distans ${distanceKm.toFixed(1)} km ≤ ${baseKm} km)`,
            details: {
                withinBase: true,
                distance: distanceKm,
                baseFee: baseFee,
                baseKm: baseKm
            }
        };
    }

    const extraKm = distanceKm - baseKm;
    const extraCost = extraKm * perKmFee;
    const total = baseFee + extraCost;

    return {
        total: roundToTwo(total),
        breakdown: `Fast avgift + tillägg för extra km`,
        details: {
            withinBase: false,
            distance: distanceKm,
            baseFee: baseFee,
            baseKm: baseKm,
            extraKm: extraKm,
            perKmFee: perKmFee,
            extraCost: extraCost
        }
    };
}

// Geocode en adress till koordinater med Nominatim (gratis)
async function geocodeAddress(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}, Sverige&limit=1`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'FraktApp/1.0' // Nominatim kräver User-Agent
        }
    });
    const data = await response.json();
    if (data.length > 0) {
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            display_name: data[0].display_name
        };
    }
    throw new Error('Adressen kunde inte hittas');
}

// Beräkna köravstånd med OSRM (gratis)
async function calculateRoute(fromLat, fromLon, toLat, toLon) {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
            distance: route.distance, // meter
            duration: route.duration  // sekunder
        };
    }
    throw new Error('Ingen rutt kunde beräknas');
}

function roundToTwo(v) {
    return Math.round(v * 100) / 100;
}

function calculateDistance() {
    const senderAddress = document.getElementById("senderAddress").value.trim();
    const destination = document.getElementById("destination").value.trim();
    const resultDiv = document.getElementById("result");

    // läs fraktparametrar
    const baseFee = parseFloat(document.getElementById('baseFee').value);
    const baseKm = parseFloat(document.getElementById('baseKm').value);
    const perKmFee = parseFloat(document.getElementById('perKmFee').value);

    if (!destination) {
        alert("Ange en leveransadress!");
        return;
    }

    // Om avsändaradress är angiven, använd den direkt
    if (senderAddress) {
        resultDiv.innerHTML = "Beräknar avstånd från avsändaradress...";
        calculateWithAddresses(senderAddress, destination, baseFee, baseKm, perKmFee);
        return;
    }

    // Annars försök använda geolocation
    resultDiv.innerHTML = "Försöker hämta din plats...";

    if (!navigator.geolocation) {
        resultDiv.innerHTML = "Din webbläsare stöder inte platsdelning. Fyll i avsändaradress istället.";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                // Geocode destinationen
                const destCoords = await geocodeAddress(destination);

                // Beräkna rutten
                const route = await calculateRoute(userLat, userLon, destCoords.lat, destCoords.lon);

                const distanceKm = route.distance / 1000;
                const durationMinutes = Math.round(route.duration / 60);
                const shipping = calculateShipping(distanceKm, baseFee, baseKm, perKmFee);

                resultDiv.innerHTML = `Avstånd: ${distanceKm.toFixed(1)} km <br> Tid: ${durationMinutes} min <br><br> Frakt: <strong>${shipping.total.toFixed(2)} SEK</strong><br> (${shipping.breakdown})`;
            } catch (error) {
                console.error('Error:', error);
                resultDiv.innerHTML = "Kunde inte beräkna rutten: " + error.message + "<br><strong>Försök ange avsändaradress istället.</strong>";
            }
        },
        (error) => {
            let message = "";
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    message = "Du nekade åtkomst till platsdata.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    message = "Platsinformation är inte tillgänglig.";
                    break;
                case error.TIMEOUT:
                    message = "Förfrågan tog för lång tid.";
                    break;
                case error.UNKNOWN_ERROR:
                default:
                    message = "Ett okänt fel inträffade vid hämtning av plats.";
                    break;
            }
            resultDiv.innerHTML = message + " <br><strong>Fyll i avsändaradress ovan och försök igen.</strong>";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// Ny hjälpfunktion för att beräkna avstånd mellan två adresser
async function calculateWithAddresses(origin, destination, baseFee, baseKm, perKmFee) {
    const resultDiv = document.getElementById("result");

    try {
        // Geocode båda adresserna
        const originCoords = await geocodeAddress(origin);
        const destCoords = await geocodeAddress(destination);

        // Beräkna rutten
        const route = await calculateRoute(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);

        const distanceKm = route.distance / 1000;
        const durationMinutes = Math.round(route.duration / 60);
        const durationText = `${durationMinutes} min`;

        const shipping = calculateShipping(distanceKm, baseFee, baseKm, perKmFee);

        let calculationDetails = '';
        if (shipping.details.withinBase) {
            calculationDetails = `
                            <div style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #4caf50;">
                                <div style="font-weight: bold; color: #2e7d32; margin-bottom: 5px;">✓ Inom basdistansen</div>
                                <div style="color: #555; font-size: 14px;">
                                    Distans: ${shipping.details.distance.toFixed(1)} km<br>
                                    Basdistans: ${shipping.details.baseKm} km<br>
                                    Fast avgift: ${shipping.details.baseFee.toFixed(2)} SEK
                                </div>
                            </div>
                        `;
        } else {
            calculationDetails = `
                            <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #ff9800;">
                                <div style="font-weight: bold; color: #e65100; margin-bottom: 8px;">📊 Specifikation:</div>
                                <table style="width: 100%; font-size: 14px; color: #555;">
                                    <tr>
                                        <td>Total distans:</td>
                                        <td style="text-align: right;"><strong>${shipping.details.distance.toFixed(1)} km</strong></td>
                                    </tr>
                                    <tr>
                                        <td>Basdistans (ingår i Fast avgift):</td>
                                        <td style="text-align: right;">${shipping.details.baseKm} km</td>
                                    </tr>
                                    <tr style="border-top: 1px solid #ddd;">
                                        <td>Extra kilometer:</td>
                                        <td style="text-align: right;"><strong>${shipping.details.extraKm.toFixed(1)} km</strong></td>
                                    </tr>
                                    <tr style="height: 8px;"></tr>
                                    <tr>
                                        <td>Fast avgift:</td>
                                        <td style="text-align: right;">${shipping.details.baseFee.toFixed(2)} SEK</td>
                                    </tr>
                                    <tr>
                                        <td>${shipping.details.extraKm.toFixed(1)} km × ${shipping.details.perKmFee.toFixed(2)} SEK/km:</td>
                                        <td style="text-align: right;">+ ${shipping.details.extraCost.toFixed(2)} SEK</td>
                                    </tr>
                                    <tr style="border-top: 2px solid #ff9800; font-weight: bold;">
                                        <td>Totalt tillägg:</td>
                                        <td style="text-align: right;">${shipping.details.extraCost.toFixed(2)} SEK</td>
                                    </tr>
                                </table>
                            </div>
                        `;
        }

        const encodedOrigin = encodeURIComponent(origin);
        const encodedDestination = encodeURIComponent(destination);
        const mapsUrl = `https://www.openstreetmap.org/directions?from=${encodedOrigin}&to=${encodedDestination}&engine=fossgis_osrm_car`;

        resultDiv.innerHTML = `
                        <div style="text-align: left; background: #f0f8ff; padding: 15px; border-radius: 8px; margin-top: 15px; border: 2px solid #0078d7;">
                            <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                                <strong>📍 Från:</strong> ${origin}<br>
                                <strong>📍 Till:</strong> ${destination}<br>
                            </div>
                            
                            <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                                <strong>🚗 Avstånd:</strong> ${distanceKm.toFixed(1)} km<br>
                                <strong>⏱️ Beräknad tid:</strong> ${durationText}
                            </div>
                            
                            ${calculationDetails}
                            
                            <div style="background: #0078d7; color: white; padding: 15px; border-radius: 6px; margin-top: 10px; text-align: center;">
                                <div style="font-size: 16px; margin-bottom: 5px;">💰 FRAKTKOSTNAD</div>
                                <div style="font-size: 28px; font-weight: bold;">${shipping.total.toFixed(2)} SEK</div>
                                <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">(enkel väg)</div>
                            </div>
                            
                            <div style="text-align: center; margin-top: 10px;">
                                <a href="${mapsUrl}" target="_blank" style="display: inline-block; background: #34a853; color: white; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                                    🗺️ Visa resväg på karta
                                </a>
                            </div>
                        </div>
                    `;
    } catch (error) {
        console.error('Error:', error);
        resultDiv.innerHTML = `
                    <div style="background: #ffebee; padding: 15px; border-radius: 8px; text-align: left; margin-top: 15px; border-left: 4px solid #c62828;">
                        <strong style="color: #c62828;">❌ Ett fel uppstod</strong><br>
                        <p style="margin: 10px 0;">${error.message}</p>
                        <p style="font-size: 14px; color: #666;">Kontrollera att adresserna är korrekta och försök igen.</p>
                    </div>
                `;
    }
}