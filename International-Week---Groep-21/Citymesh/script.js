let map;

const drones = {
    "Brussel": [
        { id: "BR-01", status: "in gebruik", batterij: "68%", snelheid: "44 km/u" },
        { id: "BR-02", status: "beschikbaar", batterij: "97%", snelheid: "0 km/u" }
    ],
    "Gent": [
        { id: "GE-01", status: "geen batterij", batterij: "0%", snelheid: "0 km/u" }
    ],
    "Antwerpen": [
        { id: "AN-01", status: "beschikbaar", batterij: "88%", snelheid: "0 km/u" }
    ],
    "Luik": [
        { id: "LU-01", status: "in vlucht", batterij: "76%", snelheid: "55 km/u" }
    ],
    "Kortrijk": [
        { id: "KO-01", status: "beschikbaar", batterij: "100%", snelheid: "0 km/u" }
    ]
};

const statusColors = {
    "beschikbaar": "groen",
    "in gebruik": "oranje",
    "in vlucht": "oranje",
    "geen batterij": "rood",
    "gereserveerd": "blauw"
};

const coordsPerStad = {
    "Brussel": [50.8503, 4.3517],
    "Gent": [51.0543, 3.7174],
    "Antwerpen": [51.2194, 4.4025],
    "Luik": [50.6326, 5.5797],
    "Kortrijk": [50.8269, 3.2649]
};

let reservations = [];
let activeFlights = [];

document.querySelector('.pilot-tab').addEventListener('click', () => {
    document.querySelector('.pilot-dashboard').classList.remove('hidden');
    document.querySelector('.admin-dashboard').classList.add('hidden');
    document.querySelector('.mechanic-dashboard').classList.add('hidden');
    initializeMap();
});

document.querySelector('.admin-tab').addEventListener('click', () => {
    document.querySelector('.pilot-dashboard').classList.add('hidden');
    document.querySelector('.admin-dashboard').classList.remove('hidden');
    document.querySelector('.mechanic-dashboard').classList.add('hidden');
    updateReservationList();
});

document.querySelector('.mechanic-tab').addEventListener('click', () => {
    document.querySelector('.pilot-dashboard').classList.add('hidden');
    document.querySelector('.admin-dashboard').classList.add('hidden');
    document.querySelector('.mechanic-dashboard').classList.remove('hidden');
});

function initializeMap() {
    if (!map) {
        map = L.map("map").setView([50.85, 4.35], 8);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        for (const stad in drones) {
            const icon = L.divIcon({
                className: 'custom-icon',
                html: '📍',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const marker = L.marker(coordsPerStad[stad], { icon }).addTo(map).bindPopup(`<strong>${stad}</strong><br>Klik voor details`);

            marker.on("click", () => {
                document.getElementById("infoPanel").classList.remove("hidden");
                document.getElementById("infoLocatie").textContent = stad;

                const listContainer = document.getElementById("droneList");
                listContainer.innerHTML = "";

                drones[stad].forEach(drone => {
                    const div = document.createElement("div");
                    div.className = `drone-item status-${statusColors[drone.status] || "grijs"}`;
                    div.innerHTML = `🚁 ${drone.id} - ${drone.status.toUpperCase()}`;

                    if (drone.status === "beschikbaar") {
                        const reserveButton = document.createElement("button");
                        reserveButton.className = "reserve-button";
                        reserveButton.textContent = "Reserveer";
                        reserveButton.addEventListener("click", () => {
                            drone.status = "gereserveerd";
                            div.className = `drone-item status-${statusColors[drone.status]}`;
                            div.innerHTML = `🚁 ${drone.id} - ${drone.status.toUpperCase()}`;
                            reserveButton.disabled = true;

                            // Voeg reservering toe aan de lijst
                            reservations.push({ id: drone.id, stad });
                            updateReservationList();

                            // Notificatie voor admin
                            addNotification('admin', `Nieuwe reserveringsaanvraag voor drone ${drone.id} in ${stad}.`);

                            // Voeg annuleren knop toe
                            const cancelButton = document.createElement("button");
                            cancelButton.className = "cancel-button";
                            cancelButton.textContent = "Annuleren";
                            cancelButton.addEventListener("click", () => {
                                drone.status = "beschikbaar";
                                div.className = `drone-item status-${statusColors[drone.status]}`;
                                div.innerHTML = `🚁 ${drone.id} - ${drone.status.toUpperCase()}`;
                                cancelButton.remove();
                                reserveButton.disabled = false;

                                // Verwijder reservering uit de lijst
                                reservations = reservations.filter(r => r.id !== drone.id);
                                updateReservationList();

                                // Notificatie voor admin
                                addNotification('admin', `Reservering geannuleerd voor drone ${drone.id} in ${stad}.`);
                            });
                            div.appendChild(cancelButton);
                        });
                        div.appendChild(reserveButton);
                    } else if (drone.status === "gereserveerd") {
                        const startButton = document.createElement("button");
                        startButton.className = "start-button";
                        startButton.textContent = "Start Vlucht";
                        startButton.addEventListener("click", () => {
                            drone.status = "in vlucht";
                            div.className = `drone-item status-${statusColors[drone.status]}`;
                            div.innerHTML = `🚁 ${drone.id} - ${drone.status.toUpperCase()}`;
                            startButton.disabled = true;

                            // Voeg vlucht toe aan de lijst
                            activeFlights.push({ id: drone.id, stad });

                            // Voeg eindigen knop toe
                            const endButton = document.createElement("button");
                            endButton.className = "end-button";
                            endButton.textContent = "Eindig Vlucht";
                            endButton.addEventListener("click", () => {
                                drone.status = "beschikbaar";
                                div.className = `drone-item status-${statusColors[drone.status]}`;
                                div.innerHTML = `🚁 ${drone.id} - ${drone.status.toUpperCase()}`;
                                endButton.remove();

                                // Verwijder vlucht uit de lijst
                                activeFlights = activeFlights.filter(f => f.id !== drone.id);
                            });
                            div.appendChild(endButton);
                        });
                        div.appendChild(startButton);
                    }

                    listContainer.appendChild(div);
                });
            });
        }
    }
}

document.getElementById("reportForm").addEventListener("submit", function(event) {
    event.preventDefault();
    const droneId = document.getElementById("droneId").value;
    const reportDetails = document.getElementById("reportDetails").value;
    const needsRepair = document.getElementById("needsRepair").checked;

    // Verwerk het verslag (bijv. stuur naar server)
    console.log("Verslag ingediend:", { droneId, reportDetails, needsRepair });

    if (needsRepair) {
        // Notificatie voor mechanieker en admin
        addNotification('admin', `Er is een probleem gemeld met de drone ${droneId}.`);
        addNotification('mechanic', `Er is een probleem gemeld met de drone ${droneId}.`);
    } else {
        // Notificatie voor admin
        addNotification('admin', `Verslag ingediend voor drone ${droneId} zonder problemen.`);
    }

    // Reset het formulier na indienen
    document.getElementById("reportForm").reset();
});

function addNotification(user, message) {
    const notifications = document.getElementById(`${user}NotificationList`);
    const notificationItem = document.createElement("div");
    notificationItem.className = "notification-item";
    notificationItem.textContent = message;
    notifications.appendChild(notificationItem);
    document.getElementById(`${user}Notifications`).classList.remove("hidden");
}

function updateReservationList() {
    const reservationList = document.getElementById("reservationList");
    reservationList.innerHTML = "";

    reservations.forEach(reservation => {
        const div = document.createElement("div");
        div.className = "reservation-item";
        div.innerHTML = `Reserveringsaanvraag voor drone ${reservation.id} in ${reservation.stad}`;

        const acceptButton = document.createElement("button");
        acceptButton.className = "accept";
        acceptButton.textContent = "Accepteren";
        acceptButton.addEventListener("click", () => {
            // Verwijder reservering uit de lijst
            reservations = reservations.filter(r => r.id !== reservation.id);
            updateReservationList();

            // Notificatie voor piloot
            addNotification('pilot', `De crowd manager heeft uw aanvraag geaccepteerd voor drone ${reservation.id}.`);
        });

        const rejectButton = document.createElement("button");
        rejectButton.className = "reject";
        rejectButton.textContent = "Weigeren";
        rejectButton.addEventListener("click", () => {
            // Verwijder reservering uit de lijst
            reservations = reservations.filter(r => r.id !== reservation.id);
            updateReservationList();

            // Notificatie voor piloot
            addNotification('pilot', `De crowd manager heeft uw aanvraag geweigerd voor drone ${reservation.id}.`);
        });

        div.appendChild(acceptButton);
        div.appendChild(rejectButton);
        reservationList.appendChild(div);
    });

    document.getElementById("reservationSection").classList.remove("hidden");
}
