import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'data.json');
const BASE_URL = '/uploads/';

async function restoreGallery() {
    try {
        if (!fs.existsSync(UPLOADS_DIR)) {
            console.log('Uploads directory not found.');
            return;
        }

        const files = await fs.readdir(UPLOADS_DIR);
        const imageFiles = files.filter(file =>
            file.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !file.startsWith('.')
        );

        console.log(`Found ${imageFiles.length} images in uploads/`);

        const imageUrls = imageFiles.map(file => BASE_URL + file);

        const data = await fs.readJson(DATA_FILE);

        // Clear old absolute localhost URLs if they exist
        data.gallery = data.gallery.filter(url => !url.startsWith('http://localhost'));

        // Merge existing gallery with discovered images, avoiding duplicates
        const existingSet = new Set(data.gallery);
        let addedCount = 0;

        imageUrls.forEach(url => {
            if (!existingSet.has(url)) {
                data.gallery.push(url);
                addedCount++;
            }
        });

        console.log(`Adding ${addedCount} missing images to data.json`);

        await fs.writeJson(DATA_FILE, data, { spaces: 2 });
        console.log('data.json updated successfully.');

    } catch (err) {
        console.error('Error restoring gallery:', err);
    }
}

restoreGallery();
