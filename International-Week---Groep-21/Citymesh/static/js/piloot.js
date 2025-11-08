let map;
const statusColors = {
    "beschikbaar": "groen",
    "bezet": "oranje",
    "defect": "rood"
};

let reservations = [];
let activeFlights = [];

initializeMap();

function initializeMap() {
    if (!map) {
        map = L.map("map").setView([50.85, 4.35], 8);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap contributors"
        }).addTo(map);

        fetch("/api/stations")
            .then(res => res.json())
            .then(stations => {
                stations.forEach(station => {
                    const { naam, latitude, longitude, drones } = station;
                    const icon = L.divIcon({
                        className: 'custom-icon',
                        html: '📍',
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                    });

                    const marker = L.marker([latitude, longitude], { icon })
                        .addTo(map)
                        .bindPopup(`<strong>${naam}</strong><br>Klik voor details`);

                    marker.on("click", () => {
                        document.getElementById("infoPanel").classList.remove("hidden");
                        document.getElementById("infoLocatie").textContent = naam;

                        const listContainer = document.getElementById("droneList");
                        listContainer.innerHTML = "";

                        drones.forEach(drone => {
                            const div = document.createElement("div");
                            const kleur = statusColors[drone.status] || "grijs";
                            div.className = `drone-item status-${kleur}`;
                            div.innerHTML = `🚁 ${drone.naam} - ${drone.status.toUpperCase()}`;

                            if (drone.status === "beschikbaar") {
                                const reserveButton = document.createElement("button");
                                reserveButton.className = "reserve-button";
                                reserveButton.textContent = "Reserveer";
                                reserveButton.addEventListener("click", () => {
                                    drone.status = "gereserveerd";
                                    div.className = `drone-item status-blauw`;
                                    div.innerHTML = `🚁 ${drone.naam} - GERESERVEERD`;
                                    reserveButton.disabled = true;

                                    // Stuur reservering naar de backend
                                    fetch("/api/reserveer", {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json"
                                        },
                                        body: JSON.stringify({
                                            drone_id: drone.id
                                        })
                                    })
                                    .then(response => response.json())
                                    .then(data => {
                                        console.log("Reservering succesvol:", data);
                                        addNotification('admin', `Nieuwe reservering voor drone ${drone.naam} in ${naam}.`);
                                    })
                                    .catch(error => {
                                        console.error("Fout bij het reserveren van drone:", error);
                                    });

                                    // Voeg cancel button toe
                                    const cancelButton = document.createElement("button");
                                    cancelButton.className = "cancel-button";
                                    cancelButton.textContent = "Annuleren";
                                    cancelButton.addEventListener("click", () => {
                                        drone.status = "beschikbaar";
                                        div.className = `drone-item status-groen`;
                                        div.innerHTML = `🚁 ${drone.naam} - BESCHIKBAAR`;
                                        cancelButton.remove();
                                        reserveButton.disabled = false;

                                        reservations = reservations.filter(r => r.id !== drone.id);

                                        addNotification('admin', `Reservering geannuleerd voor drone ${drone.naam} in ${naam}.`);
                                    });
                                    div.appendChild(cancelButton);
                                });
                                div.appendChild(reserveButton);
                            }

                            listContainer.appendChild(div);
                        });
                    });
                });
            });
    }
}

// Fetch notifications when the pilot page is opened
function fetchNotifications() {
    fetch("/api/notifications/piloot")
        .then(response => response.json())
        .then(notifications => {
            const notificationsContainer = document.getElementById("pilotNotificationList");
            notificationsContainer.innerHTML = "";

            notifications.forEach(notification => {
                const notificationItem = document.createElement("div");
                notificationItem.className = `notification-item ${notification.geleden ? 'read' : 'unread'}`;
                notificationItem.textContent = notification.boodschap;

                // Create the 'Mark as Read' button
                if (!notification.geleden) {
                    const markAsReadButton = document.createElement("button");
                    markAsReadButton.textContent = "Markeer als gelezen";
                    markAsReadButton.className = "mark-as-read-button";
                    markAsReadButton.addEventListener("click", () => {
                        markNotificationAsRead(notification.id, notificationItem);
                        fetchNotifications();
                    });
                    notificationItem.appendChild(markAsReadButton);
                }

                notificationsContainer.appendChild(notificationItem);
            });
        })
        .catch(error => console.error("Error fetching notifications:", error));
}

document.getElementById("reportForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const droneNaamInput = document.getElementById("droneId");
    const reportDetailsInput = document.getElementById("reportDetails");

    const droneNaam = droneNaamInput.value;
    const reportDetails = reportDetailsInput.value;

    fetch("/api/verslagen", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titel: droneNaam,
            inhoud: reportDetails
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Verslag ingediend:", data);

        // Vide les champs à la main (au cas où reset() ne fonctionne pas)
        droneNaamInput.innerHTML = "";
        reportDetailsInput.innerHTML = "";
    })
    .catch(error => {
        console.error("Fout bij indienen verslag:", error);
    });
});




// Function to add notifications and make them clickable
function addNotification(user, message, notificationId) {
    const notifications = document.getElementById(`${user}NotificationList`);
    const notificationItem = document.createElement("div");
    notificationItem.className = "notification-item";
    notificationItem.textContent = message;

    // Make the notification clickable to mark it as read
    notificationItem.addEventListener("click", () => {
        markNotificationAsRead(notificationId, notificationItem);
    });

    notifications.appendChild(notificationItem);
    document.getElementById(`${user}Notifications`).classList.remove("hidden");
}

// Function to send PUT request and mark the notification as read
function markNotificationAsRead(notificationId, notificationElement) {
    fetch(`/api/notificaties/${notificationId}/read`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(res => res.json())
    .then(updatedNotification => {
        // Update the UI to reflect that the notification is read
        notificationElement.style.textDecoration = "line-through"; // Optional: to visually mark it as read
        notificationElement.style.color = "#888"; // Optional: change color to indicate it's read
        const markAsReadButton = notificationElement.querySelector(".mark-as-read-button");
        if (markAsReadButton) {
            markAsReadButton.remove(); // Remove the button after it's marked as read
        }
    })
    .catch(err => console.error('Error marking notification as read:', err));
}

// Call this function to fetch notifications and reservations when the pilot logs in
fetchNotifications();
