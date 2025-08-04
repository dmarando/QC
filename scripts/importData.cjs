const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// --- Firebase Admin SDK Initialization ---
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- CSV File Paths ---
const shotgunsCsvPath = path.resolve(__dirname, '..', 'data', 'shotguns.csv');
const chokesCsvPath = path.resolve(__dirname, '..', 'data', 'chokes.csv');
const ammoCsvPath = path.resolve(__dirname, '..', 'data', 'ammo.csv');
const eventsCsvPath = path.resolve(__dirname, '..', 'data', 'events.csv');

// --- Function to Import Data ---
async function importCsvToFirestore(csvFilePath, collectionName, transformRow) {
  const collectionRef = db.collection(collectionName);
  const results = [];

  console.log(`\n--- Importing data from ${csvFilePath} to ${collectionName} ---`);

  // Check if collection already has data to avoid duplicates on re-run
  const existingDocs = await collectionRef.limit(1).get();
  if (!existingDocs.empty) {
    console.warn(`Collection '${collectionName}' already contains data. Skipping import to prevent duplicates.`);
    return;
  }

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          if (results.length === 0) {
            console.warn(`CSV file ${csvFilePath} is empty. No data to import.`);
            resolve();
            return;
          }

          const batch = db.batch();
          let count = 0;

          for (const row of results) {
            const dataToSave = transformRow(row); // Transform row data for Firestore
            if (dataToSave && dataToSave.name) { // Ensure it has a 'name' field for dropdown
              const docRef = collectionRef.doc(); // Auto-generate document ID
              batch.set(docRef, dataToSave);
              count++;
            } else {
              console.warn(`Skipping row in ${csvFilePath} due to missing or invalid data:`, row);
            }
          }

          if (count > 0) {
            await batch.commit();
            console.log(`Successfully imported ${count} documents to '${collectionName}'.`);
          } else {
            console.warn(`No valid documents with 'name' field found in ${csvFilePath}. No documents imported.`);
          }
          resolve();
        } catch (error) {
          console.error(`Error importing data to ${collectionName}:`, error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error(`Error reading CSV file ${csvFilePath}:`, error);
        reject(error);
      });
  });
}

// --- Row Transformation Functions ---
const transformShotgunRow = (row) => {
  const make = row['**Shotgun Make**'];
  const model = row['**Shotgun Model**'];
  if (make && model) {
    return {
      make: make.trim(),
      model: model.trim(),
      name: `${make.trim()} ${model.trim()}`
    };
  }
  return null;
};

const transformChokeRow = (row) => {
  const type = row['Choke Type'];
  const constriction = row['Constriction'];
  if (type && constriction) {
    return {
      type: type.trim(),
      constriction: constriction.trim(),
      name: `${type.trim()} (${constriction.trim()})`
    };
  }
  return null;
};

const transformAmmoRow = (row) => {
  const make = row['Make'];
  const model = row['Model'];
  const gauge = row['Gauge'];
  const shotSize = row['Shot Size'];
  const shotWeight = row['Shot Weight'];
  const velocityFps = row['Velocity (fps)'];

  if (make && model) {
    // Corrected name field construction to avoid duplicated 'oz' if shotWeight exists
    let name = `${make.trim()} ${model.trim()}`;
    if (gauge && gauge.trim() !== '') {
        name += ` ${gauge.trim()}`;
    }
    if (shotSize && shotSize.trim() !== '') {
        name += ` ${shotSize.trim()}`;
    }
    if (shotWeight && shotWeight.trim() !== '') {
        name += ` ${shotWeight.trim()}oz`; // Add 'oz' only if shotWeight is present
    }
    // Remove velocity from name if it causes too much length or is not desired in dropdown
    // if (velocityFps && velocityFps.trim() !== '') {
    //    name += ` ${velocityFps.trim()}fps`;
    // }

    return {
      make: make.trim(),
      model: model.trim(),
      gauge: gauge ? gauge.trim() : '',
      shotSize: shotSize ? shotSize.trim() : '',
      shotWeight: shotWeight ? shotWeight.trim() : '',
      velocityFps: velocityFps ? velocityFps.trim() : '',
      name: name.trim() // Trim the final name string
    };
  }
  return null;
};

const transformEventRow = (row) => {
  const name = row['Name'];
  if (name) {
    return {
      name: name.trim()
    };
  }
  return null;
};


// --- Run Imports ---
async function runImports() {
  try {
    await importCsvToFirestore(shotgunsCsvPath, 'shotgunOptions', transformShotgunRow);
    await importCsvToFirestore(chokesCsvPath, 'chokeOptions', transformChokeRow);
    await importCsvToFirestore(ammoCsvPath, 'ammoOptions', transformAmmoRow);
    await importCsvToFirestore(eventsCsvPath, 'eventOptions', transformEventRow);

    console.log('\n--- All imports attempted ---');
    process.exit(0);
  } catch (error) {
    console.error('An error occurred during the import process:', error);
    process.exit(1);
  }
}

runImports();