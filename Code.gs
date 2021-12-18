/**
 * @OnlyCurrentDoc
 *
 * Reference: https://developers.google.com/apps-script/guides/services/authorization
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🔥 sheets-db')
    .addItem('❓ Help', 'showHelp')
    .addItem('🟢 Start', 'showSidebar')
    .addToUi();
}

function showHelp() {
  const ui = SpreadsheetApp.getUi();

  const helpMessage = `Welcome to sheets-db!

  USAGE:
  - Edit the data on this workbook like you would on any other Google Sheet, noting KEY ASSUMPTIONS below.
  - When ready, press the "🟢 Start" button to generate a SQLite database from the data on this workbook!

  KEY ASSUMPTIONS: 
  - Each tab in this workbook is a data table
  - The first row specifies the SQLite data type for the column (i.e. it is not part of the dataset)
  - The second row is a header row (i.e. it is not part of the dataset)
  - Every other row is part of the dataset
  - All dataset values are valid
  - There are no empty rows or empty columns`;

  ui.alert('Help', helpMessage, ui.ButtonSet.OK);
}

function showSidebar() {
  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutputFromFile('query-to-db').setTitle('🔥 sheets-db');
  ui.showSidebar(html);
}

// Helper function which will be called from the client-side dialog
function generateDatabaseQuery() {
  const workbook = SpreadsheetApp.getActive();
  const sheets = workbook.getSheets();

  /** Construct SQL for creating the database */
  let query = '';
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

// Helper function to determine if the upload button should be shown on the sidebar
function backblazeCredentialsExist() {
  const properties = PropertiesService.getScriptProperties();
  const backblazeId = properties.getProperty('BACKBLAZE_ID');
  const backblazeKey = properties.getProperty('BACKBLAZE_KEY');

  return {
    'BACKBLAZE_ID': backblazeId ? true : false,
    'BACKBLAZE_KEY': backblazeKey ? true : false
  }
}

// Helper function which will be called from the client-side dialog
function uploadToBackblaze(byteArray) {
  const properties = PropertiesService.getScriptProperties();
  const backblazeId = properties.getProperty('BACKBLAZE_ID');
  const backblazeKey = properties.getProperty('BACKBLAZE_KEY');

  // b2_authorize_account
  const credentials = `Basic ${Utilities.base64Encode(`${backblazeId}:${backblazeKey}`)}`;
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
  const file = Utilities.newBlob(byteArray, 'application/vnd.sqlite3', 'database.sqlite3');
  const fileSize = byteArray.length;
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, file.getBytes());
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
      'X-Bz-File-Name': file.getName(),
      'Content-Type': file.getContentType(),
      'X-Bz-Content-Sha1': sha1
    },
    'contentLength': fileSize,
    'payload': file
  }
  const uploadResponse = UrlFetchApp.fetch(uploadUrl, uploadOptions);
}
