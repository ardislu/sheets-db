# sheets-db

Minimal Google Apps Script (GAS) project intended to quickly transform a Google Sheet into a SQLite database.

Demo here (create a copy of the Google Sheet): https://docs.google.com/spreadsheets/d/1pY-0oDh4pI8NffZQwN-AkpfJdot7bmlM9nky7w150UY/edit?usp=sharing

NOTE: you must update the hardcoded Google Drive file ID in the GAS code (see setup below), otherwise the demo will not work.

# Requirements
- A Google Drive file that can be overwritten with the Google Apps Script output
- A Google Sheet to attach this Google Apps Script project to
- A SQLite client to execute the resulting SQL query

# Initial setup

These steps only need to be completed once.

## Setting up the Google Drive file

1. Upload any file to Google Drive. The content of this file will be overwritten later. Name the file something relevant, like `generateDatabaseQuery.sql`.
2. In Google Drive, right click > get link and note the file's ID (the ID should look like this: `1xUrGGbaQLVRnytUKtnINAxzild0PBeJZ`).

## Setting up the Google Sheet

3. Create a new Google Sheet or create a copy of the [demo Google Sheet](https://docs.google.com/spreadsheets/d/1pY-0oDh4pI8NffZQwN-AkpfJdot7bmlM9nky7w150UY/edit?usp=sharing).
4. Go to Tools > Script Editor to create a new Google Apps Script (GAS) project. The GAS project is automatically attached to the Google Sheet.
5. Copy `Code.gs` into the GAS project and save. If you copied the demo Google Sheet, this code should already be there.
6. **(IMPORTANT)** In `Code.gs`, there is a reference to a [Google Apps Script property](https://developers.google.com/apps-script/guides/properties) (environment variable) named `FILE_ID`. Use the GAS user interface to set `FILE_ID` to the file ID noted in Step 2.

# Usage

1. Refresh the Google Sheet to load the GAS code.
2. See the new custom menu button `SQLite`. Press `SQLite > Help` for end-user instructions.
3. Press `SQLite > Generate SQLite database query` to generate the database generation SQL query.
4. In your favorite SQLite client (example: [sqliteviz](https://lana-k.github.io/sqliteviz/#/workspace)), paste in the SQL query and run it.
