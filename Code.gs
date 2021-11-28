const UI = SpreadsheetApp.getUi();
const WORKBOOK = SpreadsheetApp.getActive();

const PROPERTIES = PropertiesService.getScriptProperties();
const FILE_ID = PROPERTIES.getProperty('FILE_ID');
const BACKBLAZE_ID = PROPERTIES.getProperty('BACKBLAZE_ID');
const BACKBLAZE_KEY = PROPERTIES.getProperty('BACKBLAZE_KEY');

function onOpen() {
  UI.createMenu('🔥 SQLite')
    .addItem('❓ Help', 'showHelp')
    .addItem('Download SQLite database', 'showDatabaseDownloadDialog')
    .addItem('Upload to Backblaze', 'uploadToBackblaze')
    .addToUi();
}

function showHelp() {
  const helpMessage = `Welcome to sheets-db!

USAGE:
- Edit the data on this workbook like you would on any other Google Sheet, noting KEY ASSUMPTIONS below.
- When ready, press the "Download SQLite database" button to generate and download a SQLite database from the workbook's data!

KEY ASSUMPTIONS: 
- Each tab in this workbook is a data table
- The first row specifies the SQLite data type for the column (i.e. it is not part of the dataset)
- The second row is a header row (i.e. it is not part of the dataset)
- Every other row is part of the dataset
- All dataset values are valid
- There are no empty rows or empty columns`;

  UI.alert('Help', helpMessage, UI.ButtonSet.OK);
}

// Helper function which will be called from the client-side dialog
function generateDatabaseQuery() {
  const sheets = WORKBOOK.getSheets();

  /** Construct SQL for creating the database */
  let query = `-- This query was generated by sheets-db
-- https://github.com/ardislu/sheets-db/
`;
  for (let sheet of sheets) {
    const tableName = sheet.getSheetName();
    const dataset = sheet.getDataRange().getValues(); // Assuming there are no empty rows or empty columns
    const datatypes = dataset.shift();
    const headers = dataset.shift();

    // Headers
    let columns = '';
    for (let i = 0; i < headers.length; i++) {
      columns += `'${headers[i]}' ${datatypes[i]},`;
    }
    columns = columns.slice(0, -1); // Remove trailing comma from the last header

    // Values
    let values = '';
    for (let row of dataset) {
      values += '(';

      for (let col = 0; col < row.length; col++) {
        switch (datatypes[col]) {
          case 'INTEGER':
          case 'REAL':
            values += `${row[col]},`;
            break;
          case 'TEXT':
          case 'BLOB':
            const data = row[col]; // Can be string or date object
            if (data instanceof Date) {
              values += `'${data.toISOString()}',`;
            }
            else {
              values += `'${data.replace(/'/g, "''")}',`; // Escape apostrophe with double apostrophe
            }
            break;
          case 'NULL':
          default:
            values += 'null,';
            break;
        }
      }
      values = values.slice(0, -1); // Remove trailing comma from the last value

      values += '),';
    }
    values = values.slice(0, -1) + ';'; // Replace the final comma with a semicolon

    // Insert the query to generate this data table
    query += `
    CREATE TABLE ${tableName} (${columns});
    INSERT INTO ${tableName} VALUES ${values}
    `;
  }

  return query;
}

function showDatabaseDownloadDialog() {
  const html = HtmlService.createHtmlOutputFromFile('query-to-db');
  UI.showModalDialog(html, 'Generating database...');
}

function uploadToBackblaze() {
  // b2_authorize_account
  const credentials = `Basic ${Utilities.base64Encode(`${BACKBLAZE_ID}:${BACKBLAZE_KEY}`)}`;
  const authOptions = {
    'headers': {
      'Authorization': credentials
    }
  };
  const authResponse = UrlFetchApp.fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', authOptions);
  const authJson = JSON.parse(authResponse.getContentText());
  const apiUrl = authJson['apiUrl']; // Must use this host for the next API call
  let authToken = authJson['authorizationToken']; // This token can change after calling b2_get_upload_url
  const bucketId = authJson['allowed']['bucketId'];

  // b2_get_upload_url
  const getUploadUrlOptions = {
    'method': 'POST',
    'headers': {
      'Authorization': authToken
    },
    'payload': JSON.stringify({
      'bucketId': bucketId
    })
  };
  const getUploadUrlResponse = UrlFetchApp.fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, getUploadUrlOptions);
  const getUploadUrlJson = JSON.parse(getUploadUrlResponse.getContentText());
  authToken = getUploadUrlJson['authorizationToken'];
  const uploadUrl = getUploadUrlJson['uploadUrl'];

  // b2_upload_file
  const file = DriveApp.getFileById(FILE_ID);
  const fileName = file.getName();
  const mimeType = 'text/plain'; // Use 'text/plain' to enable compression by CDN. file.getMimeType() gives 'application/octet-stream', which will not be compressed.
  const contentLength = file.getSize();
  const data = file.getBlob();
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, data.getBytes());
  let sha1 = '';
  for (let byte of digest) {
    if (byte < 0) {
      byte += 256; // Negative values are 8-bit overflows, need to add 256
    }
    sha1 += byte.toString(16).padStart(2, '0');
  }

  const uploadOptions = {
    'method': 'POST',
    'headers': {
      'Authorization': authToken,
      'X-Bz-File-Name': fileName,
      'Content-Type': mimeType,
      'X-Bz-Content-Sha1': sha1
    },
    'contentLength': contentLength,
    'payload': data
  }
  const uploadResponse = UrlFetchApp.fetch(uploadUrl, uploadOptions);

  UI.alert('Success!', 'Google Drive file was successfully uploaded to Backblaze.', UI.ButtonSet.OK);
}
