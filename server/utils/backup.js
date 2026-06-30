const fs = require('fs');
const path = require('path');
const MenuItem = require('../models/MenuItem');

const backupDir = path.join(__dirname, '../../backups');

// Crea cartella backup se non esiste
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function createBackup() {
    try {
        const dishes = await MenuItem.find().lean();
        const backupName = `menu-backup-${Date.now()}.json`;
        const backupPath = path.join(backupDir, backupName);
        
        fs.writeFileSync(backupPath, JSON.stringify(dishes, null, 2));
        
        console.log(`✅ Backup creato con successo: ${backupName}`);
        return backupPath;
    } catch (error) {
        console.error('❌ Errore durante la creazione del backup:', error);
        throw error;
    }
}

async function restoreBackup(backupFilePath) {
    try {
        const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
        
        // Elimina tutti i piatti esistenti
        await MenuItem.deleteMany({});
        
        // Ripristina i piatti dal backup
        await MenuItem.insertMany(data);
        
        console.log('✅ Backup ripristinato con successo!');
    } catch (error) {
        console.error('❌ Errore durante il ripristino del backup:', error);
        throw error;
    }
}

function listBackups() {
    const files = fs.readdirSync(backupDir);
    const backupFiles = files.filter(file => file.startsWith('menu-backup-'));
    return backupFiles.sort().reverse().map(file => ({
        name: file,
        path: path.join(backupDir, file),
        date: new Date(parseInt(file.split('-')[2])),
        size: fs.statSync(path.join(backupDir, file)).size
    }));
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups
};
