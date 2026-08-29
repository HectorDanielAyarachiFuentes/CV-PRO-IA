const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
    try {
        const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 21 >>\nstream\nBT /F1 12 Tf 10 700 Td (Test) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000213 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n285\n%%EOF');
        
        console.log("First attempt...");
        let res1 = await pdfParse(dummyPdf);
        console.log("First attempt SUCCESS");
        
        console.log("Second attempt...");
        let res2 = await pdfParse(dummyPdf);
        console.log("Second attempt SUCCESS");
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
