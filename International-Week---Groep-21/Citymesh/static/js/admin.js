let map;
let reservations = [];

document.addEventListener("DOMContentLoaded", () => {
    loadReservations();
});

// Haal de reserveringen op uit de database
function loadReservations() {
    fetch("/api/reservaties")
        .then(res => res.json())
        .then(data => {
            // Filter enkel de 'pending' reserveringen
            reservations = data.filter(r => r.status === "pending");
            updateReservationList();
        });
}

// Update de lijst van reserveringen op de admin pagina
function updateReservationList() {
    const reservationList = document.getElementById("reservationList");
    reservationList.innerHTML = "";

    reservations.forEach(reservation => {
        const div = document.createElement("div");
        div.className = "reservation-item";
        div.innerHTML = `Reserveringsaanvraag voor drone ${reservation.drone_naam} in ${reservation.station_naam || 'onbekende locatie'}`;

        const acceptButton = document.createElement("button");
        acceptButton.className = "accept";
        acceptButton.textContent = "Accepteren";
        acceptButton.addEventListener("click", () => {
            updateReservationStatus(reservation.id, "accepted");
        });

        const rejectButton = document.createElement("button");
        rejectButton.className = "reject";
        rejectButton.textContent = "Weigeren";
        rejectButton.addEventListener("click", () => {
            updateReservationStatus(reservation.id, "rejected");
        });

        const innerDiv = document.createElement("div");
        innerDiv.appendChild(acceptButton);
        innerDiv.appendChild(rejectButton);
        div.appendChild(innerDiv);
        reservationList.appendChild(div);
    });
}

// Updaten van reserveringsstatus met PUT
function updateReservationStatus(reservationId, newStatus) {
    fetch(`/api/reservaties/${reservationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        console.log(data.message);
        loadReservations();
        addNotification("admin", data.message);
    })
    .catch(err => console.error("Fout bij updaten reservering:", err));
}

// Voeg notificatie toe aan de admin of piloot
function addNotification(user, message) {
    const notifications = document.getElementById(`${user}NotificationList`);
    const notificationItem = document.createElement("div");
    notificationItem.className = "notification-item";
    notificationItem.textContent = message;
    notifications.appendChild(notificationItem);
}
