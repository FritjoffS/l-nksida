// pdf-lib is loaded via script tag, use global PDFLib
const { PDFDocument, rgb } = PDFLib;

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('skyltForm');
  const generateButton = document.getElementById('generateButton');
  const previewContainer = document.getElementById('previewContainer');
  const previewIframe = document.getElementById('previewIframe');
  const downloadButton = document.getElementById('downloadButton');
  const previewModal = document.getElementById('previewModal');
  const modalPreviewIframe = document.getElementById('modalPreviewIframe');
  const closeModalX = document.getElementById('closeModalX');

  let generatedPdfBytes = null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateSkylt();
  });

  closeModalX.addEventListener('click', () => {
    previewModal.close();
  });

  async function generateSkylt() {
    const imageFile = document.getElementById('productImage').files[0];
    const imageUrl = document.getElementById('imageUrl').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;

    if (!imageFile && !imageUrl) {
      alert('Välj en bildfil eller ange en bild-URL.');
      return;
    }

    if (!price) {
      alert('Fyll i pris.');
      return;
    }

    generateButton.disabled = true;
    generateButton.textContent = 'Genererar...';

    try {
      // Load the template PDF
      const templateResponse = await fetch('mall.pdf');
      if (!templateResponse.ok) {
        throw new Error('Kunde inte ladda mall.pdf');
      }
      const templateBytes = await templateResponse.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);

      // Get the first page (assuming template has at least one page)
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new Error('Mall.pdf har inga sidor');
      }
      const page = pages[0];
      const { width, height } = page.getSize();

      // Load and embed image
      let image;
      if (imageFile) {
        const imageBytes = await imageFile.arrayBuffer();
        if (imageFile.type === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (imageFile.type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          throw new Error('Bildformat stöds inte. Använd JPEG eller PNG.');
        }
      } else {
        const response = await fetch(imageUrl);
        const imageBytes = await response.arrayBuffer();
        const contentType = response.headers.get('content-type');
        if (contentType === 'image/jpeg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (contentType === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          throw new Error('Bild-URL måste vara JPEG eller PNG.');
        }
      }

      // Draw image (centered horizontally, 80% of page width, maintaining aspect ratio, not closer than 40mm from top)
      const maxImageWidth = width * 0.8;
      const aspectRatio = image.height / image.width;
      const imageWidth = maxImageWidth;
      const imageHeight = imageWidth * aspectRatio;
      const imageX = (width - imageWidth) / 2;
      const minYFromTop = 113;  // ~40mm in points
      const desiredY = height - 363;
      const imageY = Math.min(desiredY, height - minYFromTop - imageHeight);
      page.drawImage(image, {
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
      });

      // Draw price (bottom left corner, moved up another 20mm)
      page.drawText(price, {
        x: 50,
        y: 214,  // 157 + ~57 points (additional 20mm)
        size: 36,
        color: rgb(0, 0, 0),
      });

      // Draw description (bottom left corner, below price, moved up another 20mm) if provided
      if (description.trim()) {
        const descriptionLines = description.split('\n');
        let yPos = 184;  // 127 + ~57 points (additional 20mm)
        descriptionLines.forEach(line => {
          page.drawText(line, {
            x: 50,
            y: yPos,
            size: 18,
            color: rgb(0, 0, 0),
          });
          yPos -= 25;
        });
      }

      // Generate PDF bytes
      generatedPdfBytes = await pdfDoc.save();

      // Log analytics event
      if (window.logAnalyticsEvent) {
        window.logAnalyticsEvent('skylt_generated', {
          has_image: !!(imageFile || imageUrl),
          has_price: !!price,
          has_description: !!description.trim()
        });
      }

      // Show preview in modal
      const blob = new Blob([generatedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      modalPreviewIframe.src = url + '#zoom=50&fit'; // zooma till 50% i förhandsgranskning & anpassa till utskrivbart område
      previewModal.showModal();
      generateButton.textContent = 'Generera Skylt';
      generateButton.disabled = false;

    } catch (error) {
      console.error('Fel vid generering av skylt:', error);
      alert('Ett fel uppstod: ' + error.message);
      generateButton.textContent = 'Generera Skylt';
      generateButton.disabled = false;
    }
  }
});