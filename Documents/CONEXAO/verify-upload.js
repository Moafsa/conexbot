const fs = require('fs');
const path = require('path');

async function testUpload() {
    // Create a minimal valid PDF buffer
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });

    const formData = new FormData();
    formData.append('file', blob, 'test.pdf');

    console.log('Sending upload request locally...');

    try {
        const response = await fetch('http://localhost:3000/api/ai/architect/upload', {
            method: 'POST',
            body: formData,
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Check if server is ready before running (simple delay or loop could be added, but manual timing is safer for now)
console.log('Waiting 5s for server to settle...');
setTimeout(testUpload, 5000);
