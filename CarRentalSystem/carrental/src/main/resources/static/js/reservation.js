
const vehicles = {
    corolla: {
        name: "Toyota Corolla",
        type: "Sedan",
        price: 55,
        image: "images/corolla.png"
    },
    civic: {
        name: "Honda Civic",
        type: "Sedan",
        price: 60,
        image: "images/civic.png"
    },
    rav4: {
        name: "Toyota RAV4",
        type: "SUV",
        price: 85,
        image: "images/rav4.png"
    },
    escape: {
        name: "Ford Escape",
        type: "SUV",
        price: 90,
        image: "images/escape.png"
    }
};

// Get selected car from URL
const params = new URLSearchParams(window.location.search);
const carId = params.get("car");
const car = vehicles[carId];

if (!car) {
    window.location.replace("cars.html");
}

// HTML elements
const carName = document.getElementById("carName");
const carType = document.getElementById("carType");
const carImage = document.getElementById("carImage");
const dailyRate = document.getElementById("dailyRate");

const pickupDate = document.getElementById("pickupDate");
const returnDate = document.getElementById("returnDate");
const rentalDays = document.getElementById("rentalDays");
const totalPrice = document.getElementById("totalPrice");
const form = document.getElementById("reservationForm");
const message = document.getElementById("reservationMessage");

// Format currency
function money(amount) {
    return "$" + amount.toFixed(2);
}

// Get today's local date
function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

// Add or subtract days
function addDays(dateString, number) {
    const date = new Date(dateString + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + number);

    return date.toISOString().slice(0, 10);
}

// Load saved reservations
function getReservations() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("carRentalReservations") || "[]"
        );

        return Array.isArray(saved) ? saved : [];
    } catch {
        return [];
    }
}

// Get existing bookings for selected car
function getCarBookings() {
    return getReservations().filter(reservation =>
        reservation.carId === carId &&
        reservation.status !== "Cancelled" &&
        reservation.pickupDate &&
        reservation.returnDate &&
        reservation.pickupDate < reservation.returnDate
    );
}

// Get unavailable dates
function getBookedDates() {
    const today = getToday();

    return getCarBookings()
        .filter(booking => booking.returnDate > today)
        .map(booking => ({
            from: booking.pickupDate,
            to: addDays(booking.returnDate, -1)
        }));
}

// Display selected vehicle
function displayCar() {
    if (!car) return;

    carName.textContent = car.name;
    carType.textContent = car.type;
    carImage.src = car.image;
    carImage.alt = car.name;
    dailyRate.textContent = money(car.price);
}

// Return date calendar
const returnPicker = flatpickr("#returnDate", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    minDate: addDays(getToday(), 1),
    clickOpens: false,
    disableMobile: true,

    onChange: function() {
        updateTotal();
    }
});

// Pickup date calendar
const pickupPicker = flatpickr("#pickupDate", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "F j, Y",
    minDate: getToday(),
    disable: getBookedDates(),
    disableMobile: true,

    onOpen: function() {
        pickupPicker.set("minDate", getToday());
        pickupPicker.set("disable", getBookedDates());
    },

    onChange: function() {
        updateReturnCalendar();
        updateTotal();
    }
});

// Update return calendar based on pickup date
function updateReturnCalendar() {
    const pickup = pickupDate.value;

    returnPicker.clear();

    if (!pickup) {
        returnPicker.set("clickOpens", false);
        returnPicker.set("minDate", addDays(getToday(), 1));
        returnPicker.set("maxDate", null);
        return;
    }

    returnPicker.set("clickOpens", true);
    returnPicker.set("minDate", addDays(pickup, 1));

    // Find next existing reservation
    const nextBookings = getCarBookings()
        .filter(booking => booking.pickupDate > pickup)
        .sort((a, b) =>
            a.pickupDate.localeCompare(b.pickupDate)
        );

    if (nextBookings.length > 0) {
        returnPicker.set(
            "maxDate",
            nextBookings[0].pickupDate
        );
    } else {
        returnPicker.set("maxDate", null);
    }
}

// Calculate rental duration
function calculateDays() {
    const start = pickupDate.value;
    const end = returnDate.value;

    if (!start || !end || start < getToday() || end <= start) {
        return 0;
    }

    const startTime = Date.parse(start + "T00:00:00Z");
    const endTime = Date.parse(end + "T00:00:00Z");

    return Math.round(
        (endTime - startTime) / 86400000
    );
}

// Check for overlapping reservations
function isAlreadyBooked(start, end) {
    return getCarBookings().some(booking =>
        start < booking.returnDate &&
        end > booking.pickupDate
    );
}

// Update estimated rental cost
function updateTotal() {
    if (!car) return;

    const days = calculateDays();

    if (days > 0) {
        rentalDays.textContent =
            `${days} day(s) x ${money(car.price)}/day`;

        totalPrice.textContent =
            `Estimated Total: ${money(days * car.price)}`;
    } else {
        rentalDays.textContent = "Select valid rental dates";
        totalPrice.textContent = "Estimated Total: $0.00";
    }

    message.textContent = "";
    message.className = "";
}

// Confirm reservation
form.addEventListener("submit", event => {
    event.preventDefault();

    if (!car) return;

    const start = pickupDate.value;
    const end = returnDate.value;
    const days = calculateDays();

    // Validate dates
    if (days <= 0) {
        message.textContent =
            "Please select valid pickup and return dates.";
        message.className = "error";
        return;
    }

    // Check if vehicle is already booked
    if (isAlreadyBooked(start, end)) {
        pickupPicker.clear();
        updateReturnCalendar();
        pickupPicker.set("disable", getBookedDates());
        updateTotal();

        message.textContent =
            "This car is already reserved for those dates.";
        message.className = "error";
        return;
    }

    const customerName = document
        .getElementById("customerName").value.trim();

    const customerEmail = document
        .getElementById("customerEmail").value.trim();

    if (!customerName || !customerEmail) {
        message.textContent =
            "Please enter your name and email.";
        message.className = "error";
        return;
    }

    // Create reservation
    const reservation = {
        id: Date.now().toString(),
        carId: carId,
        carName: car.name,
        pickupDate: start,
        returnDate: end,
        customerName: customerName,
        customerEmail: customerEmail,
        total: days * car.price,
        status: "Active"
    };

    // Get existing reservations
    const reservations = getReservations();
    reservations.push(reservation);

    // Save reservation in browser
    try {
        localStorage.setItem(
            "carRentalReservations",
            JSON.stringify(reservations)
        );

        // Replace Rental Details box with confirmation
        const bookingPanel = document.querySelector(".booking-panel");

        const confirmation = document.createElement("div");
        confirmation.style.textAlign = "center";

        // Success message
        const successMessage = document.createElement("h3");
        successMessage.textContent = "Reservation saved successfully!";

        Object.assign(successMessage.style, {
            color: "#28a745",
            fontSize: "24px",
            marginBottom: "25px"
        });

        // View My Rentals button
        const rentalsButton = document.createElement("a");
        rentalsButton.href = "rentals.html";
        rentalsButton.textContent = "View My Rentals";

        Object.assign(rentalsButton.style, {
            display: "inline-block",
            backgroundColor: "#28a745",
            color: "white",
            padding: "14px 30px",
            borderRadius: "5px",
            textDecoration: "none",
            fontSize: "16px",
            fontWeight: "bold"
        });

        // Add confirmation elements
        confirmation.appendChild(successMessage);
        confirmation.appendChild(rentalsButton);

        // Replace the form with the confirmation
        bookingPanel.replaceChildren(confirmation);

        Object.assign(bookingPanel.style, {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "280px"
        });

    } catch {
        message.textContent = "Unable to save reservation.";
        message.className = "error";
    }
});

// Get dates passed from Browse Cars
const requestedPickup = params.get("pickup");
const requestedReturn = params.get("return");

// Initialize page
displayCar();
updateTotal();

// Automatically fill dates from Browse Cars
if (
    car &&
    requestedPickup &&
    requestedReturn &&
    requestedPickup >= getToday() &&
    requestedReturn > requestedPickup &&
    !isAlreadyBooked(requestedPickup, requestedReturn)
) {
    pickupPicker.setDate(requestedPickup, true, "Y-m-d");
    returnPicker.setDate(requestedReturn, true, "Y-m-d");
}
