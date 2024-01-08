// script.js

// Function to generate barcode
function generateBarcode() {
    console.log("Generating barcode...");

    // Get the barcode input value
    var barcodeInput = document.getElementById("barcode-input").value;

    // Check if the input is not empty
    if (barcodeInput.trim() !== "") {
        console.log("Barcode input:", barcodeInput);

        // Get the checkbox value
        var displayValueCheckbox = document.getElementById("display-value-checkbox");
        var displayValue = displayValueCheckbox.checked;

        // Clear previous barcode
        var generatedBarcode = document.getElementById("generated-barcode");
        generatedBarcode.innerHTML = "";

        // Create a new element for barcode rendering
        var barcodeCanvas = document.createElement("canvas");

        // Append the canvas to the container
        generatedBarcode.appendChild(barcodeCanvas);

        // Generate barcode using JsBarcode
        JsBarcode(barcodeCanvas, barcodeInput, {
            format: "CODE128", // You can use other barcode formats as needed
            displayValue: displayValue // Set to true to display the value below the barcode
        });
    }
}

// Function to generate barcodes
function generateBarcodes() {
    // Get the barcode input value as a string
    var barcodeInput = document.getElementById("barcode-input").value;

    // Split the input string into an array of barcode values
    var barcodeArray = barcodeInput.split(/\r?\n/);

    // Get the checkbox value
    var displayValueCheckbox = document.getElementById("display-value-checkbox");
    var displayValue = displayValueCheckbox.checked;

    // Clear previous barcodes
    var generatedBarcodes = document.getElementById("generated-barcodes");
    generatedBarcodes.innerHTML = "";

    // Loop through each barcode value and generate a barcode
    barcodeArray.forEach(function (barcodeValue) {
        // Check if the input is not empty
        if (barcodeValue.trim() !== "") {
            // Create a new element for barcode rendering
            var barcodeCanvas = document.createElement("canvas");

            // Append the canvas to the container
            generatedBarcodes.appendChild(barcodeCanvas);

            // Generate barcode using JsBarcode
            JsBarcode(barcodeCanvas, barcodeValue, {
                format: "CODE128", // You can use other barcode formats as needed
                displayValue: displayValue // changes with checkbox
            });
        }
    });
}
