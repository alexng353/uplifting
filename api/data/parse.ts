import * as fs from 'fs';

interface MuscleEntry {
  muscle: string;
  location: string;
  origin: string;
  insertion: string;
  artery: string;
  nerve: string;
  action: string;
  antagonist: string;
  o: number;
  ta: number;
}

function parseMuscleTable(table: string): MuscleEntry[] {
  const rows = table.split(/\|- style="vertical-align: top;"/).slice(1); // Split rows and ignore header

  return rows.map(row => {
    const columns = row.split('\n').map(chopUntilPipe);
    columns.shift();
    // .replace(/\{\{[^}]+\}\}/g, '') // Remove templates like {{...}}
    // .replace(/<[^>]+>/g, '') // Remove HTML tags
    // .split('|').slice(1); // Split columns and ignore the first empty element

    return {
      muscle: extractText(columns[0]),
      location: extractText(columns[1]),
      origin: extractText(columns[2]),
      insertion: extractText(columns[3]),
      artery: extractText(columns[4]),
      nerve: extractText(columns[5]),
      action: extractText(columns[6]),
      antagonist: extractText(columns[7] || '?'),
      o: parseInt(columns[8] || '0', 10),
      ta: parseInt(columns[9] || '0', 10),
    };
  });
}

function extractText(input: string): string {
  return input
    .replace(/\[\[(.*?)\|(.*?)\]\]/g, "$2")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/\<ref[^>]*>.*?<\/ref>/g, '') // Remove references like <ref>...</ref>
    .trim();
}


function chopUntilPipe(input: string): string {
  const pipeIndex = input.indexOf('|');
  return pipeIndex >= 0 ? input.slice(pipeIndex + 1) : input;
}

// Read data from file
fs.readFile('data.txt', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const parsedData = parseMuscleTable(data);
  // console.log(parsedData[0]);
  console.log(parsedData);

  fs.writeFile('muscle-data.json', JSON.stringify(parsedData, null, 2), (err) => {
    if (err) {
      console.error('Error writing file:', err);
      return;
    }
    console.log('Data written to muscle-data.json');
  });
});
