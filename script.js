/* =====================================================
   ParkPal – Smart Parking Management System
   INT335 – Product Design and Prototyping
   Plain JavaScript only (no libraries, no frameworks)
   ===================================================== */


/* ---------- 1. CONSTANTS AND GLOBAL VARIABLES ---------- */

// Key used to save the data in the browser's localStorage
var STORAGE_KEY = "parkpalSlots";

// Parking layout settings
var ROW_NAMES = ["A", "B", "C", "D"];   // 4 rows
var COLUMNS_PER_ROW = 5;                // 5 columns
var LAST_TWO_WHEELER_COLUMN = 2;        // columns 1 and 2 are for two-wheelers

// Array that stores all 20 slot objects
var parkingSlots = [];

// ID of the slot that the user clicked (example: "B3"), or null
var selectedSlotId = null;

// Used to hide the message after a few seconds
var messageTimer = null;


/* ---------- 2. GETTING HTML ELEMENTS ---------- */

var parkingGrid = document.getElementById("parkingGrid");
var parkingForm = document.getElementById("parkingForm");
var vehicleNumberInput = document.getElementById("vehicleNumber");
var messageBox = document.getElementById("messageBox");

var totalSlotsText = document.getElementById("totalSlots");
var vacantSlotsText = document.getElementById("vacantSlots");
var occupiedSlotsText = document.getElementById("occupiedSlots");
var availabilityPercentText = document.getElementById("availabilityPercent");
var availabilityBar = document.getElementById("availabilityBar");
var zoneSummaryText = document.getElementById("zoneSummary");

var selectedSlotName = document.getElementById("selectedSlotName");
var selectedSlotDetails = document.getElementById("selectedSlotDetails");

var filterTypeSelect = document.getElementById("filterType");
var filterStatusSelect = document.getElementById("filterStatus");
var filterInfoText = document.getElementById("filterInfo");
var resetFilterButton = document.getElementById("resetFilterButton");

var releaseButton = document.getElementById("releaseButton");
var clearSelectionButton = document.getElementById("clearSelectionButton");
var resetAllButton = document.getElementById("resetAllButton");

var vehicleTableBody = document.getElementById("vehicleTableBody");
var emptyTableText = document.getElementById("emptyTableText");


/* ---------- 3. CREATING THE SLOTS ---------- */

// Creates the 20 slots using two loops (rows and columns)
function createDefaultSlots() {
    var slots = [];

    for (var r = 0; r < ROW_NAMES.length; r++) {
        for (var c = 1; c <= COLUMNS_PER_ROW; c++) {

            // Columns 1 and 2 = two-wheeler, columns 3, 4, 5 = four-wheeler
            var slotType;
            if (c <= LAST_TWO_WHEELER_COLUMN) {
                slotType = "two-wheeler";
            } else {
                slotType = "four-wheeler";
            }

            // Each slot is an object with its own details
            var slot = {
                id: ROW_NAMES[r] + c,       // example: A1, B3
                row: ROW_NAMES[r],
                column: c,
                type: slotType,
                status: "vacant",           // "vacant" or "occupied"
                vehicleNumber: "",
                vehicleType: "",
                entryTime: ""
            };

            slots.push(slot);
        }
    }

    return slots;
}


/* ---------- 4. LOCAL STORAGE (SAVE AND LOAD) ---------- */

// Saves the slots array in localStorage as a text (JSON string)
function saveSlots() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parkingSlots));
}

// Loads saved slots. If nothing is saved, creates fresh slots.
function loadSlots() {
    var savedData = localStorage.getItem(STORAGE_KEY);

    if (savedData === null) {
        return createDefaultSlots();
    }

    try {
        var loadedSlots = JSON.parse(savedData);

        // Make sure the saved data looks correct
        var expectedCount = ROW_NAMES.length * COLUMNS_PER_ROW;
        if (Array.isArray(loadedSlots) && loadedSlots.length === expectedCount) {
            return loadedSlots;
        }
    } catch (error) {
        console.log("Saved data was damaged. Starting fresh.");
    }

    return createDefaultSlots();
}


/* ---------- 5. HELPER FUNCTIONS ---------- */

// Finds one slot object using its ID
function findSlotById(slotId) {
    for (var i = 0; i < parkingSlots.length; i++) {
        if (parkingSlots[i].id === slotId) {
            return parkingSlots[i];
        }
    }
    return null;
}

// Reads which vehicle type radio button is selected
function getSelectedVehicleType() {
    var radioButtons = document.getElementsByName("vehicleType");

    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].checked) {
            return radioButtons[i].value;
        }
    }
    return "two-wheeler";
}

// Changes "two-wheeler" into "Two-Wheeler" for display
function getTypeLabel(type) {
    if (type === "two-wheeler") {
        return "Two-Wheeler";
    }
    return "Four-Wheeler";
}

// Returns an emoji for the vehicle type
function getTypeIcon(type) {
    if (type === "two-wheeler") {
        return "🏍️";
    }
    return "🚗";
}

// Checks if a registration number is valid (6 to 10 letters/numbers)
function isValidRegistration(number) {
    var pattern = /^[A-Z0-9]{6,10}$/;
    return pattern.test(number);
}

// Checks if this registration number is already parked somewhere
function isVehicleAlreadyParked(number) {
    for (var i = 0; i < parkingSlots.length; i++) {
        if (parkingSlots[i].status === "occupied" && parkingSlots[i].vehicleNumber === number) {
            return true;
        }
    }
    return false;
}

// Converts a saved time (milliseconds) into a readable time
function formatTime(timeValue) {
    var date = new Date(timeValue);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Gives the parked duration in minutes
function getParkedMinutes(timeValue) {
    var difference = Date.now() - timeValue;
    return Math.max(1, Math.round(difference / 60000));
}


/* ---------- 6. SUCCESS AND ERROR MESSAGES ---------- */

// messageType is either "success" or "error"
function showMessage(text, messageType) {
    messageBox.textContent = text;
    messageBox.className = "message-box message-" + messageType;

    // Hide the message automatically after 4 seconds
    clearTimeout(messageTimer);
    messageTimer = setTimeout(function () {
        messageBox.className = "message-box hidden";
    }, 4000);
}


/* ---------- 7. DASHBOARD STATISTICS ---------- */

function updateStatistics() {
    var totalCount = parkingSlots.length;
    var occupiedCount = 0;
    var twoWheelerOccupied = 0;
    var fourWheelerOccupied = 0;

    // Count occupied slots using a loop
    for (var i = 0; i < parkingSlots.length; i++) {
        if (parkingSlots[i].status === "occupied") {
            occupiedCount++;

            if (parkingSlots[i].type === "two-wheeler") {
                twoWheelerOccupied++;
            } else {
                fourWheelerOccupied++;
            }
        }
    }

    var vacantCount = totalCount - occupiedCount;
    var availabilityPercent = Math.round((vacantCount / totalCount) * 100);

    // Show the numbers on the page
    totalSlotsText.textContent = totalCount;
    vacantSlotsText.textContent = vacantCount;
    occupiedSlotsText.textContent = occupiedCount;
    availabilityPercentText.textContent = availabilityPercent + "%";
    availabilityBar.style.width = availabilityPercent + "%";

    zoneSummaryText.textContent =
        "Two-wheeler slots occupied: " + twoWheelerOccupied + " of 8  |  " +
        "Four-wheeler slots occupied: " + fourWheelerOccupied + " of 12";
}


/* ---------- 8. DRAWING THE PARKING GRID ---------- */

// Checks if a slot matches the filters chosen by the user
function slotMatchesFilter(slot) {
    var typeFilter = filterTypeSelect.value;
    var statusFilter = filterStatusSelect.value;

    if (typeFilter !== "all" && slot.type !== typeFilter) {
        return false;
    }
    if (statusFilter !== "all" && slot.status !== statusFilter) {
        return false;
    }
    return true;
}

// Builds all rows and slots on the page using loops
function renderParkingGrid() {
    parkingGrid.innerHTML = "";
    var matchingCount = 0;

    for (var r = 0; r < ROW_NAMES.length; r++) {

        // Create one row
        var rowDiv = document.createElement("div");
        rowDiv.className = "parking-row";

        // Row label (A, B, C or D)
        var labelDiv = document.createElement("div");
        labelDiv.className = "row-label";
        labelDiv.textContent = ROW_NAMES[r];
        rowDiv.appendChild(labelDiv);

        // Create the 5 slots of this row
        for (var c = 1; c <= COLUMNS_PER_ROW; c++) {
            var slot = findSlotById(ROW_NAMES[r] + c);
            var slotDiv = createSlotElement(slot);

            if (slotMatchesFilter(slot)) {
                matchingCount++;
            } else {
                slotDiv.classList.add("slot-dimmed");
            }

            rowDiv.appendChild(slotDiv);
        }

        parkingGrid.appendChild(rowDiv);
    }

    filterInfoText.textContent =
        "Showing " + matchingCount + " of " + parkingSlots.length + " slots that match the filters.";
}

// Creates the HTML element for a single slot
function createSlotElement(slot) {
    var slotDiv = document.createElement("div");
    slotDiv.className = "slot";

    // Decide the colour class: green, red or blue
    if (slot.status === "occupied") {
        slotDiv.classList.add("slot-occupied");
    } else if (slot.id === selectedSlotId) {
        slotDiv.classList.add("slot-selected");
    } else {
        slotDiv.classList.add("slot-vacant");
    }

    // Occupied slot that is picked (so the user can release it)
    if (slot.status === "occupied" && slot.id === selectedSlotId) {
        slotDiv.classList.add("slot-picked");
    }

    // Text inside the slot
    var statusText;
    var extraText = "";
    if (slot.status === "occupied") {
        statusText = "Occupied";
        extraText = slot.vehicleNumber;
    } else if (slot.id === selectedSlotId) {
        statusText = "Selected";
    } else {
        statusText = "Vacant";
    }

    slotDiv.innerHTML =
        '<span class="slot-id">' + slot.id + '</span>' +
        '<span class="slot-icon">' + getTypeIcon(slot.type) + '</span>' +
        '<span class="slot-status">' + statusText + '</span>' +
        '<span class="slot-number">' + extraText + '</span>';

    slotDiv.title = slot.id + " – " + getTypeLabel(slot.type) + " slot";

    // Click event: select this slot
    slotDiv.addEventListener("click", function () {
        handleSlotClick(slot.id);
    });

    return slotDiv;
}


/* ---------- 9. SELECTED SLOT PANEL ---------- */

function renderSelectedSlotPanel() {
    if (selectedSlotId === null) {
        selectedSlotName.textContent = "None";
        selectedSlotDetails.textContent = "Click a slot in the parking area.";
        return;
    }

    var slot = findSlotById(selectedSlotId);
    selectedSlotName.textContent = slot.id;

    if (slot.status === "occupied") {
        selectedSlotDetails.textContent =
            getTypeLabel(slot.type) + " slot | Occupied by " + slot.vehicleNumber +
            " since " + formatTime(slot.entryTime);
    } else {
        selectedSlotDetails.textContent =
            getTypeLabel(slot.type) + " slot | Vacant and ready to use";
    }
}


/* ---------- 10. TABLE OF PARKED VEHICLES ---------- */

function renderVehicleTable() {
    vehicleTableBody.innerHTML = "";
    var parkedCount = 0;

    for (var i = 0; i < parkingSlots.length; i++) {
        var slot = parkingSlots[i];

        if (slot.status === "occupied") {
            parkedCount++;

            var row = document.createElement("tr");
            row.innerHTML =
                "<td><strong>" + slot.id + "</strong></td>" +
                "<td>" + slot.vehicleNumber + "</td>" +
                "<td>" + getTypeIcon(slot.vehicleType) + " " + getTypeLabel(slot.vehicleType) + "</td>" +
                "<td>" + formatTime(slot.entryTime) + "</td>" +
                '<td><button type="button" class="btn btn-red btn-small">Release</button></td>';

            // The release button inside this row
            addTableReleaseEvent(row.querySelector("button"), slot.id);
            vehicleTableBody.appendChild(row);
        }
    }

    // Show a message if the table is empty
    if (parkedCount === 0) {
        emptyTableText.classList.remove("hidden");
    } else {
        emptyTableText.classList.add("hidden");
    }
}

// Separate function so each button remembers its own slot ID
function addTableReleaseEvent(button, slotId) {
    button.addEventListener("click", function () {
        releaseSlot(slotId);
    });
}


/* ---------- 11. REFRESH EVERYTHING ---------- */

// Called every time something changes
function refreshPage() {
    renderParkingGrid();
    renderSelectedSlotPanel();
    renderVehicleTable();
    updateStatistics();
}


/* ---------- 12. MAIN FEATURES ---------- */

// Feature: select a slot by clicking it
function handleSlotClick(slotId) {
    var slot = findSlotById(slotId);

    // Clicking the same slot again removes the selection
    if (selectedSlotId === slotId) {
        selectedSlotId = null;
        refreshPage();
        return;
    }

    selectedSlotId = slotId;

    if (slot.status === "occupied") {
        // Occupied slots cannot be used for parking, but they can be released
        showMessage("Slot " + slot.id + " is occupied. You can release it using the Release button.", "error");
    } else {
        // Automatically choose the vehicle type that fits this slot
        var radioButtons = document.getElementsByName("vehicleType");
        for (var i = 0; i < radioButtons.length; i++) {
            if (radioButtons[i].value === slot.type) {
                radioButtons[i].checked = true;
            }
        }
        showMessage("Slot " + slot.id + " selected (" + getTypeLabel(slot.type) + " slot).", "success");
    }

    refreshPage();
}

// Feature: park a vehicle (runs when the form is submitted)
function handleParkVehicle(event) {
    event.preventDefault();   // stop the page from reloading

    // Step 1: a slot must be selected
    if (selectedSlotId === null) {
        showMessage("Please select a parking slot first.", "error");
        return;
    }

    var slot = findSlotById(selectedSlotId);
    var chosenType = getSelectedVehicleType();

    // Remove spaces and dashes, then make it capital letters
    var vehicleNumber = vehicleNumberInput.value.replace(/[\s-]/g, "").toUpperCase();

    // Step 2: the slot must not be occupied
    if (slot.status === "occupied") {
        showMessage("Slot " + slot.id + " is already occupied. Please choose a vacant slot.", "error");
        return;
    }

    // Step 3: the slot must support the chosen vehicle type
    if (slot.type !== chosenType) {
        showMessage("Slot " + slot.id + " is for " + getTypeLabel(slot.type) +
            "s only. Please choose a matching slot or vehicle type.", "error");
        return;
    }

    // Step 4: registration number must be entered and valid
    if (vehicleNumber === "") {
        showMessage("Please enter the vehicle registration number.", "error");
        return;
    }
    if (!isValidRegistration(vehicleNumber)) {
        showMessage("Invalid registration number. Use 6 to 10 letters or digits, e.g. PB08AB1234.", "error");
        return;
    }

    // Step 5: the same vehicle cannot be parked twice
    if (isVehicleAlreadyParked(vehicleNumber)) {
        showMessage("Vehicle " + vehicleNumber + " is already parked.", "error");
        return;
    }

    // Everything is correct, so park the vehicle
    slot.status = "occupied";
    slot.vehicleNumber = vehicleNumber;
    slot.vehicleType = chosenType;
    slot.entryTime = Date.now();

    saveSlots();
    showMessage("Vehicle " + vehicleNumber + " parked successfully in slot " + slot.id + ".", "success");

    // Clear the form and the selection
    vehicleNumberInput.value = "";
    selectedSlotId = null;
    refreshPage();
}

// Feature: release a slot when the vehicle leaves
function releaseSlot(slotId) {
    var slot = findSlotById(slotId);

    if (slot.status === "vacant") {
        showMessage("Slot " + slot.id + " is already vacant. Nothing to release.", "error");
        return;
    }

    var leavingVehicle = slot.vehicleNumber;
    var minutes = getParkedMinutes(slot.entryTime);

    // Make the slot vacant again
    slot.status = "vacant";
    slot.vehicleNumber = "";
    slot.vehicleType = "";
    slot.entryTime = "";

    if (selectedSlotId === slot.id) {
        selectedSlotId = null;
    }

    saveSlots();
    showMessage("Vehicle " + leavingVehicle + " left slot " + slot.id +
        " after " + minutes + " minute(s). Slot is now vacant.", "success");
    refreshPage();
}

// Release button in the booking panel
function handleReleaseButton() {
    if (selectedSlotId === null) {
        showMessage("Please select an occupied (red) slot to release.", "error");
        return;
    }
    releaseSlot(selectedSlotId);
}

// Clear selection button
function handleClearSelection() {
    selectedSlotId = null;
    vehicleNumberInput.value = "";
    refreshPage();
}

// Reset every slot back to vacant
function handleResetAll() {
    var sure = confirm("This will remove all parked vehicles. Are you sure?");

    if (sure) {
        parkingSlots = createDefaultSlots();
        selectedSlotId = null;
        saveSlots();
        showMessage("All slots have been reset to vacant.", "success");
        refreshPage();
    }
}

// Clear both filters
function handleClearFilters() {
    filterTypeSelect.value = "all";
    filterStatusSelect.value = "all";
    refreshPage();
}


/* ---------- 13. EVENT LISTENERS ---------- */

parkingForm.addEventListener("submit", handleParkVehicle);
releaseButton.addEventListener("click", handleReleaseButton);
clearSelectionButton.addEventListener("click", handleClearSelection);
resetAllButton.addEventListener("click", handleResetAll);
resetFilterButton.addEventListener("click", handleClearFilters);
filterTypeSelect.addEventListener("change", refreshPage);
filterStatusSelect.addEventListener("change", refreshPage);


/* ---------- 14. START THE APPLICATION ---------- */

// Load saved data (or create new slots) and draw the page
parkingSlots = loadSlots();
refreshPage();
