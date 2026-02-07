import fs from 'fs';

// 1. Load your existing file
const rawData = fs.readFileSync('../localsearch/src/data/uule_updated.json', 'utf8');
const uuleArray = JSON.parse(rawData);

const updatedArray = uuleArray.map((item) => {
  try {
    // Google UULE format: Prefix (10 chars) + Base64(Location)
    const base64Part = item.uule.slice(10);
    const decodedLocation = Buffer.from(base64Part, 'base64').toString('utf8');
    
    // Split "City,State,Country"
    const parts = decodedLocation.split(',');

    return {
      ...item,
      // If there are 3 parts (City, State, Country), index 1 is the state.
      // If only 2 parts (City, Country), we leave state empty.
      state: parts.length >= 2 ? parts[1].trim() : ""
    };
  } catch (error) {
    console.error(`Could not decode UULE for city: ${item.city}`);
    return { ...item, state: "" };
  }
});

// 2. Save the new file
fs.writeFileSync('./src/data/uule_updated.json', JSON.stringify(updatedArray, null, 2));
console.log('Success! Created uule_updated.json with state fields.');