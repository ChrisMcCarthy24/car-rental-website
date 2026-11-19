
const vehicleTableBody = document.getElementById("vehicleTableBody");
const reservationTableBody = document.getElementById("reservationTableBody");
const vehicleForm = document.getElementById("vehicleForm");
const adminMessage = document.getElementById("adminMessage");

const defaultVehicles = [
    {
        id: "corolla",
        name: "Toyota Corolla",
        type: "Sedan",
        price: 55,
        image: "images/corolla.png",
        available: true
    },
    {
        id: "civic",
        name: "Honda Civic",
        type: "Sedan",
        price: 60,
        image: "images/civic.png",
        available: true
    },
    {
        id: "rav4",
        name: "Toyota RAV4",
        type: "SUV",
        price: 85,
        image: "images/rav4.png",
        available: true
    },
    {
        id: "escape",
        name: "Ford Escape",
        type: "SUV",
        price: 90,
        image: "images/escape.png",
        available: true
    }
];

// Load vehicles
function loadVehicles() {
    const saved = localStorage.getItem("carRentalVehicles");

    if (saved === null) {
        return defaultVehicles.map(vehicle => ({ ...vehicle }));
    }

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return defaultVehicles.map(vehicle => ({ ...vehicle }));
    }
}

let vehicles = loadVehicles();

// Save vehicles
function saveVehicles(updated) {
    try {
        localStorage.setItem(
            "carRentalVehicles",
            JSON.stringify(updated)
        );

        vehicles = updated;
        displayVehicles();
        displayStats();
        return true;
    } catch {
        adminMessage.textContent = "Unable to save vehicle changes.";
        return false;
    }
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

// Format price
function formatPrice(price) {
    return "$" + Number(price).toFixed(2);
}

// Format date
function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value + "T00:00:00Z");

    return date.toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC"
    });
}

// Get today's date
function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

// Determine reservation status
function getStatus(reservation) {
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

// Create a table cell
function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
}

// Create an action button
function createButton(label, className, action) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className;
    button.addEventListener("click", action);
    return button;
}

// Update dashboard summary
function displayStats() {
    const reservations = loadReservations();

    document.getElementById("totalVehicles").textContent =
        vehicles.length;

    document.getElementById("availableVehicles").textContent =
        vehicles.filter(vehicle => vehicle.available).length;

    document.getElementById("totalReservations").textContent =
        reservations.length;
}

// Display vehicle table
function displayVehicles() {
    vehicleTableBody.replaceChildren();

    if (vehicles.length === 0) {
        const row = document.createElement("tr");
        const cell = addCell(row, "No vehicles found.");
        cell.colSpan = 5;
        vehicleTableBody.appendChild(row);
        return;
    }

    vehicles.forEach(vehicle => {
        const row = document.createElement("tr");

        addCell(row, vehicle.name);
        addCell(row, vehicle.type);
        addCell(row, formatPrice(vehicle.price));

        const availabilityCell = addCell(
            row,
            vehicle.available ? "Available" : "Unavailable"
        );

        availabilityCell.className = vehicle.available
            ? "status-available"
            : "status-unavailable";

        const actions = document.createElement("td");
        actions.className = "admin-actions";

        // Edit button
        actions.appendChild(
            createButton("Edit", "edit-btn", () => {
                editVehicle(vehicle.id);
            })
        );

        // Availability button
        actions.appendChild(
            createButton(
                vehicle.available ? "Make Unavailable" : "Make Available",
                "availability-btn",
                () => toggleAvailability(vehicle.id)
            )
        );

        // Remove button
        actions.appendChild(
            createButton("Remove", "remove-btn", () => {
                removeVehicle(vehicle.id);
            })
        );

        row.appendChild(actions);
        vehicleTableBody.appendChild(row);
    });
}

// Add or edit vehicle
vehicleForm.addEventListener("submit", event => {
    event.preventDefault();

    const id = document.getElementById("vehicleId").value;
    const name = document.getElementById("vehicleName").value.trim();
    const type = document.getElementById("vehicleType").value;
    const price = Number(
        document.getElementById("vehiclePrice").value
    );
    const image = document.getElementById("vehicleImage").value.trim();
    const available =
        document.getElementById("vehicleAvailable").checked;

    if (!name || !image || !Number.isFinite(price) || price <= 0) {
        adminMessage.textContent = "Please enter valid vehicle information.";
        return;
    }

    if (id) {
        const updated = vehicles.map(vehicle =>
            vehicle.id === id
                ? { ...vehicle, name, type, price, image, available }
                : vehicle
        );

        if (saveVehicles(updated)) {
            adminMessage.textContent = "Vehicle updated successfully.";
        }
    } else {
        const newVehicle = {
            id: "car-" + Date.now(),
            name,
            type,
            price,
            image,
            available
        };

        if (saveVehicles([...vehicles, newVehicle])) {
            adminMessage.textContent = "Vehicle added successfully.";
        }
    }

    if (!adminMessage.textContent.startsWith("Unable")) {
        clearForm();
    }
});

// Edit existing vehicle
function editVehicle(id) {
    const vehicle = vehicles.find(vehicle => vehicle.id === id);
    if (!vehicle) return;

    document.getElementById("vehicleId").value = vehicle.id;
    document.getElementById("vehicleName").value = vehicle.name;
    document.getElementById("vehicleType").value = vehicle.type;
    document.getElementById("vehiclePrice").value = vehicle.price;
    document.getElementById("vehicleImage").value = vehicle.image;
    document.getElementById("vehicleAvailable").checked =
        vehicle.available;

    document.getElementById("vehicleFormTitle").textContent =
        "Edit Vehicle";

    vehicleForm.scrollIntoView({ behavior: "smooth" });
}

// Change availability
function toggleAvailability(id) {
    const updated = vehicles.map(vehicle => {
        if (vehicle.id === id) {
            return { ...vehicle, available: !vehicle.available };
        }
        return vehicle;
    });

    if (saveVehicles(updated)) {
        adminMessage.textContent = "Vehicle availability updated.";
    }
}

// Remove vehicle
function removeVehicle(id) {
    const vehicle = vehicles.find(vehicle => vehicle.id === id);
    if (!vehicle) return;

    // Prevent removing a vehicle with current/upcoming rentals
    const hasReservations = loadReservations().some(reservation =>
        reservation.carId === id &&
        ["Upcoming", "Active"].includes(getStatus(reservation))
    );

    if (hasReservations) {
        adminMessage.textContent =
            "Cannot remove a vehicle with current or upcoming reservations.";
        return;
    }

    if (!confirm("Are you sure you want to remove " + vehicle.name + "?")) {
        return;
    }

    if (saveVehicles(vehicles.filter(vehicle => vehicle.id !== id))) {
        adminMessage.textContent = "Vehicle removed successfully.";
        clearForm();
    }
}

// Clear vehicle form
function clearForm() {
    vehicleForm.reset();
    document.getElementById("vehicleId").value = "";
    document.getElementById("vehicleFormTitle").textContent =
        "Add New Vehicle";
}

document.getElementById("cancelEdit").addEventListener(
    "click",
    clearForm
);

// Display customer reservations
function displayReservations() {
    reservationTableBody.replaceChildren();

    const reservations = loadReservations();

    if (reservations.length === 0) {
        const row = document.createElement("tr");
        const cell = addCell(row, "No reservations found.");
        cell.colSpan = 6;
        reservationTableBody.appendChild(row);
        return;
    }

    reservations.forEach(reservation => {
        const row = document.createElement("tr");

        addCell(row, reservation.customerName);
        addCell(row, reservation.carName);
        addCell(row, formatDate(reservation.pickupDate));
        addCell(row, formatDate(reservation.returnDate));
        addCell(row, formatPrice(reservation.total));
        addCell(row, getStatus(reservation));

        reservationTableBody.appendChild(row);
    });
}

// Load dashboard
displayStats();
displayVehicles();
displayReservations();
