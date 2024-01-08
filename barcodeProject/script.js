// Function to generate a single barcode
function generateBarcode(inputId, outputId) {
    // Get the barcode input value
    var barcodeInput = document.getElementById(inputId).value;

    // Clear previous barcode
    var generatedBarcode = document.getElementById(outputId);
    generatedBarcode.innerHTML = "";

    // Create a new element for barcode rendering
    var barcodeCanvas = document.createElement("canvas");

    // Append the canvas to the container
    generatedBarcode.appendChild(barcodeCanvas);

    // Generate barcode using JsBarcode with display value option
    JsBarcode(barcodeCanvas, barcodeInput, {
        format: "CODE128", // You can use other barcode formats as needed
        displayValue: false, // Whether to display the barcode value below the barcode
    });
}

document.getElementById("barcode-input-1").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        // Prevent the default behavior of the "Enter" key (e.g., form submission)
        event.preventDefault();
        
        // Call the function to generate the barcode
        generateBarcode("barcode-input-1", "generated-barcode-1");
    }
});     