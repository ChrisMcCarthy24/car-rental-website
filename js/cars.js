
const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const priceFilter = document.getElementById("priceFilter");

const pickupDate = document.getElementById("searchPickupDate");
const returnDate = document.getElementById("searchReturnDate");

const cars = document.querySelectorAll(".car-card");
const resultsCount = document.getElementById("resultsCount");
const noResults = document.getElementById("noResults");
const dateMessage = document.getElementById("dateMessage");

// Get today's local date
function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

// Add days to a date
function addDays(dateString, days) {
    const date = new Date(dateString + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + days);

    return date.toISOString().slice(0, 10);
}

// Prevent selecting past dates
pickupDate.min = getToday();
returnDate.min = addDays(getToday(), 1);

// Load existing reservations
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

// Check if a vehicle is available for selected dates
function isCarAvailable(carId, start, end, reservations) {
    return !reservations.some(reservation => {
        return (
            reservation.carId === carId &&
            reservation.status !== "Cancelled" &&
            start < reservation.returnDate &&
            end > reservation.pickupDate
        );
    });
}

// Filter cars
function filterCars() {
    const search = searchInput.value.toLowerCase().trim();
    const type = typeFilter.value;
    const price = priceFilter.value;

    const start = pickupDate.value;
    const end = returnDate.value;

    const hasBothDates = Boolean(start && end);
    const validDates =
        hasBothDates &&
        start >= getToday() &&
        end > start;

    const reservations = getReservations();

    // Display date instructions or errors
    if (start && !end) {
        dateMessage.textContent =
            "Select a return date to check availability.";
    } else if (!start && end) {
        dateMessage.textContent =
            "Select a pickup date to check availability.";
    } else if (hasBothDates && !validDates) {
        dateMessage.textContent =
            "Return date must be after pickup date.";
    } else {
        dateMessage.textContent = "";
    }

    let visibleCount = 0;

    cars.forEach(car => {
        const carId = car.dataset.carId;
        const carName = car.dataset.name.toLowerCase();
        const carType = car.dataset.type;
        const carPrice = Number(car.dataset.price);

        // Existing search and filters
        const matchesSearch = carName.includes(search);

        const matchesType =
            type === "all" || carType === type;

        const matchesPrice =
            price === "all" || carPrice <= Number(price);

        // Check availability if both dates are selected
        const matchesAvailability =
            !validDates ||
            isCarAvailable(carId, start, end, reservations);

        const showCar =
            matchesSearch &&
            matchesType &&
            matchesPrice &&
            matchesAvailability;

        if (showCar) {
            car.style.display = "block";
            visibleCount++;
        } else {
            car.style.display = "none";
        }

        // Pass selected dates to the reservation page
        const reserveButton = car.querySelector(".reserve-btn");

        const url = new URL(
            "reservation.html",
            window.location.href
        );

        url.searchParams.set("car", carId);

        if (validDates) {
            url.searchParams.set("pickup", start);
            url.searchParams.set("return", end);
        }

        reserveButton.href = url.href;
    });

    // Update results count
    const label = validDates
        ? "available vehicle"
        : "vehicle";

    resultsCount.textContent =
        `Showing ${visibleCount} ${label}${visibleCount === 1 ? "" : "s"}`;

    // Show message if no cars match
    noResults.hidden = visibleCount !== 0;

    noResults.textContent = validDates
        ? "No cars available for those dates and filters."
        : "No cars match your search.";
}

// When pickup date changes
pickupDate.addEventListener("change", () => {
    const start = pickupDate.value;

    returnDate.min = start
        ? addDays(start, 1)
        : addDays(getToday(), 1);

    if (returnDate.value && returnDate.value <= start) {
        returnDate.value = "";
    }

    filterCars();
});

// When return date changes
returnDate.addEventListener("change", filterCars);

// Existing filters
searchInput.addEventListener("input", filterCars);
typeFilter.addEventListener("change", filterCars);
priceFilter.addEventListener("change", filterCars);

// Filter when the page loads
filterCars();
