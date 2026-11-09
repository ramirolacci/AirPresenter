import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const distDir = path.resolve('dist');
const outputFile = path.resolve('AirPresenter-Extension.zip');

if (!fs.existsSync(distDir)) {
    console.error('❌ Error: la carpeta dist/ no existe. Ejecuta primero npm run build');
    process.exit(1);
}

const zip = new JSZip();

function addFilesRecursively(currentPath, zipFolder) {
    const items = fs.readdirSync(currentPath);
    for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
            addFilesRecursively(itemPath, zipFolder.folder(item));
        } else {
            const data = fs.readFileSync(itemPath);
            zipFolder.file(item, data);
        }
    }
}

console.log('📦 Empaquetando AirPresenter para Chrome Web Store...');
addFilesRecursively(distDir, zip);

zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } })
    .then((buffer) => {
        fs.writeFileSync(outputFile, buffer);
        const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
        console.log(`✅ ¡Paquete creado con éxito!`);
        console.log(`📁 Archivo: ${outputFile} (${sizeMb} MB)`);
        console.log(`🚀 Listo para subir directamente a Google Chrome Web Store Developer Dashboard.`);
    })
    .catch((err) => {
        console.error('❌ Error al generar ZIP:', err);
        process.exit(1);
    });

