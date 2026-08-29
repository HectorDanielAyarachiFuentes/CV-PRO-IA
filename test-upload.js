const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function upload() {
    try {
        const formData = new FormData();
        // Create a dummy PDF file
        const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf 10 700 Td (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000213 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n285\n%%EOF');
        
        fs.writeFileSync('dummy.pdf', dummyPdf);
        formData.append('cvFile', fs.createReadStream('dummy.pdf'));
        
        console.log("Sending first request...");
        const res1 = await fetch('http://localhost:3000/api/upload-cv', {
            method: 'POST',
            body: formData
        });
        console.log("First request status:", res1.status);
        console.log(await res1.json());
        
        const formData2 = new FormData();
        formData2.append('cvFile', fs.createReadStream('dummy.pdf'));
        console.log("Sending second request...");
        const res2 = await fetch('http://localhost:3000/api/upload-cv', {
            method: 'POST',
            body: formData2
        });
        console.log("Second request status:", res2.status);
        console.log(await res2.json());
        
    } catch (e) {
        console.error(e);
    }
}

upload();
