
const activeRentals = document.getElementById("activeRentals");
const pastRentals = document.getElementById("pastRentals");
const rentalMessage = document.getElementById("rentalMessage");

// Car images
const carImages = {
    corolla: "images/corolla.png",
    civic: "images/civic.png",
    rav4: "images/rav4.png",
    escape: "images/escape.png"
};

// Get today's date
function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

// Load reservations
function loadReservations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("carRentalReservations") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

let reservations = loadReservations();

// Save reservations
function saveReservations(updated) {
    try {
        localStorage.setItem(
            "carRentalReservations",
            JSON.stringify(updated)
        );

        reservations = updated;
        displayRentals();
        return true;
    } catch {
        rentalMessage.textContent =
            "Unable to save changes.";
        return false;
    }
}

// Format price
function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return "N/A";

    const date = new Date(dateString + "T00:00:00Z");

    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    });
}

// Determine reservation status
function getReservationStatus(reservation) {
    const today = getToday();

    if (reservation.status === "Cancelled") {
        return "Cancelled";
    }

    if (reservation.pickupDate > today) {
        return "Upcoming";
    }

    if (reservation.returnDate > today) {
        return "Active";
    }

    return "Completed";
}

// Add rental information
function addDetail(container, label, value) {
    const paragraph = document.createElement("p");
    paragraph.textContent = label + ": " + value;
    container.appendChild(paragraph);
}

// Create rental card
function createRentalCard(reservation, status) {
    const card = document.createElement("div");
    card.className = "rental-card";

    // Vehicle image
    if (carImages[reservation.carId]) {
        const image = document.createElement("img");
        image.src = carImages[reservation.carId];
        image.alt = reservation.carName;
        image.className = "rental-car-image";
        card.appendChild(image);
    }

    const info = document.createElement("div");
    info.className = "rental-info";

    const title = document.createElement("h4");
    title.textContent = reservation.carName;
    info.appendChild(title);

    addDetail(info, "Customer", reservation.customerName);
    addDetail(info, "Pickup", formatDate(reservation.pickupDate));
    addDetail(info, "Return", formatDate(reservation.returnDate));
    addDetail(info, "Total Cost", formatPrice(reservation.total));

    // Display status
    const statusText = document.createElement("p");
    statusText.className = "rental-status";
    statusText.textContent = "Status: " + status;
    info.appendChild(statusText);

    // Cancel active or upcoming reservations
    if (status === "Upcoming" || status === "Active") {
        const cancelButton = document.createElement("button");
        cancelButton.className = "cancel-btn";
        cancelButton.textContent = "Cancel Reservation";

        cancelButton.addEventListener("click", () => {
            cancelReservation(reservation.id);
        });

        info.appendChild(cancelButton);
    }

    // Remove completed or cancelled rentals
    if (status === "Completed" || status === "Cancelled") {
        const removeButton = document.createElement("button");
        removeButton.className = "remove-rental-btn";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            removeRental(reservation.id);
        });

        info.appendChild(removeButton);
    }

    card.appendChild(info);
    return card;
}

// Create Clear Past Rentals button
const clearPastButton = document.createElement("button");
clearPastButton.textContent = "Clear Past Rentals";
clearPastButton.className = "clear-past-btn";

const pastSection = pastRentals.closest(".rental-section");
const pastHeading = pastSection.querySelector("h3");

pastHeading.insertAdjacentElement("afterend", clearPastButton);

clearPastButton.addEventListener("click", clearPastRentals);

// Display all reservations
function displayRentals() {
    activeRentals.replaceChildren();
    pastRentals.replaceChildren();

    const current = [];
    const previous = [];

    reservations.forEach(reservation => {
        const status = getReservationStatus(reservation);

        if (status === "Upcoming" || status === "Active") {
            current.push({ reservation, status });
        } else {
            previous.push({ reservation, status });
        }
    });

    // Current and upcoming rentals
    if (current.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-rentals";
        message.textContent =
            "You have no current or upcoming rentals.";

        activeRentals.appendChild(message);
    } else {
        current.forEach(item => {
            activeRentals.appendChild(
                createRentalCard(item.reservation, item.status)
            );
        });
    }

    // Previous and cancelled rentals
    if (previous.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-rentals";
        message.textContent = "No previous rentals found.";

        pastRentals.appendChild(message);
        clearPastButton.hidden = true;
    } else {
        clearPastButton.hidden = false;

        previous.forEach(item => {
            pastRentals.appendChild(
                createRentalCard(item.reservation, item.status)
            );
        });
    }
}

// Cancel reservation
function cancelReservation(id) {
    const confirmed = confirm(
        "Are you sure you want to cancel this reservation?"
    );

    if (!confirmed) return;

    const currentReservations = loadReservations();

    const updated = currentReservations.map(reservation => {
        const status = getReservationStatus(reservation);

        if (reservation.id === id &&
            (status === "Upcoming" || status === "Active")) {
            return {
                ...reservation,
                status: "Cancelled"
            };
        }

        return reservation;
    });

    if (saveReservations(updated)) {
        rentalMessage.textContent =
            "Reservation cancelled successfully.";
    }
}

// Remove an individual past rental
function removeRental(id) {
    const confirmed = confirm(
        "Are you sure you want to remove this rental from your history?"
    );

    if (!confirmed) return;

    const currentReservations = loadReservations();

    const updated = currentReservations.filter(reservation => {
        const status = getReservationStatus(reservation);

        if (reservation.id !== id) {
            return true;
        }

        return status !== "Completed" && status !== "Cancelled";
    });

    if (saveReservations(updated)) {
        rentalMessage.textContent =
            "Rental removed successfully.";
    }
}

// Clear all previous and cancelled rentals
function clearPastRentals() {
    const confirmed = confirm(
        "Are you sure you want to clear all previous and cancelled rentals?"
    );

    if (!confirmed) return;

    const currentReservations = loadReservations();

    const updated = currentReservations.filter(reservation => {
        const status = getReservationStatus(reservation);

        return status === "Upcoming" || status === "Active";
    });

    if (saveReservations(updated)) {
        rentalMessage.textContent =
            "Past rentals cleared successfully.";
    }
}

// Display rentals when page loads
displayRentals();
