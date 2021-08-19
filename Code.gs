function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('SQLite')
    .addItem('Help', 'showHelp')
    .addItem('Generate SQLite database query', 'generateDatabaseQuery')
    .addToUi();
}

function showHelp() {
  const helpMessage = `Welcome to sheets-db!

USAGE:
- Edit the data on this workbook like you would on any other Google Sheet, noting KEY ASSUMPTIONS below.
- When ready, press the "Generate SQLite database query" button to generate a SQL query which can be used to write a SQLite database containing this workbook's data!

KEY ASSUMPTIONS: 
- Each tab in this workbook is a data table
- The first row specifies the SQLite data type for the column (i.e. it is not part of the dataset)
- The second row is a header row (i.e. it is not part of the dataset)
- Every other row is part of the dataset
- All dataset values are valid
- There are no empty rows or empty columns`;

  const ui = SpreadsheetApp.getUi();
  ui.alert('Help', helpMessage, ui.ButtonSet.OK);
}

function generateDatabaseQuery() {
  /**
   * KEY ASSUMPTIONS: 
   * - Each tab in this workbook is a data table
   * - The first row specifies the SQLite data type for the column (i.e. it is not part of the dataset)
   * - The second row is a header row (i.e. it is not part of the dataset)
   * - Every other row is part of the dataset
   * - All dataset values are valid
   * - There are no empty rows or empty columns
   */

  const sheets = SpreadsheetApp.getActive().getSheets();
  const fileId = '1xUrGGbaQLVRnytUKtnINAxzild0PBeJZ'; // Google Drive file ID to store the final SQL query

  /** Construct SQL for creating the database */
  let query = `-- This query was generated by sheets-db
-- https://docs.google.com/spreadsheets/d/1pY-0oDh4pI8NffZQwN-AkpfJdot7bmlM9nky7w150UY/
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

  // URL to download the file:
  // https://drive.google.com/u/0/uc?id=1xUrGGbaQLVRnytUKtnINAxzild0PBeJZ&export=download
  DriveApp.getFileById(fileId).setContent(query);

  const ui = SpreadsheetApp.getUi();
  ui.alert('Success!', `Query generated! Download here: https://drive.google.com/u/0/uc?id=${fileId}&export=download`, ui.ButtonSet.OK);
}
