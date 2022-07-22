# sheets-db

Minimal [Google Apps Script (GAS)](https://developers.google.com/apps-script) project intended to quickly transform a Google Sheet into a SQLite database.

[Click here to create a copy of the demo Google Sheet (the required GAS code will also be copied)](https://docs.google.com/spreadsheets/d/1pY-0oDh4pI8NffZQwN-AkpfJdot7bmlM9nky7w150UY/copy).

# Requirements
- A Google Sheet to attach this Google Apps Script project to

# Initial setup

These steps only need to be completed once.

## Setting up the Google Sheet

1. Create a new Google Sheet or create a copy of the [demo Google Sheet](https://docs.google.com/spreadsheets/d/1pY-0oDh4pI8NffZQwN-AkpfJdot7bmlM9nky7w150UY/copy).
2. Go to `Extensions > Apps Script` to create a new Google Apps Script (GAS) project. The GAS project is automatically attached to the Google Sheet.
3. Copy `Code.gs` and `sidebar.html` into the GAS project and save. If you copied the demo Google Sheet, this code should already be there.

## (OPTIONAL) Setting up "Upload .sqlite3 file to Backblaze"

If you use [Backblaze](https://www.backblaze.com/) as a storage provider, you can use the "Upload .sqlite3 file to Backblaze" button to upload the SQLite database directly to Backblaze. 

This setup is **NOT** necessary if you only want to generate SQLite databases.

4. In Backblaze, create a new application key with write access to the storage bucket where you want to upload the file to.
5. Note the `keyID` and `applicationKey` shown.
6. In the GAS editor, create the following [Google Apps Script properties](https://developers.google.com/apps-script/guides/properties) (environment variables) under `Project Settings > Script Properties`:
- `BACKBLAZE_ID` - the Backblaze application key ID (`keyId`) from step 5.
- `BACKBLAZE_KEY` - the Backblaze application key (`applicationKey`) from step 5.

# Usage

1. Refresh the Google Sheet and wait for the GAS code to finish loading.
2. See the new custom menu button `🔥 sheets-db`. Press `🔥 sheets-db > ❓ Help` for end-user instructions.
3. Press `🔥 sheets-db > 🟢 Start` to initialize the SQLite sidebar.
4. Click the buttons on the sidebar to generate the SQLite database and/or upload the file to Backblaze.
5. Upload the .sqlite3 file to your favorite SQLite client (example: [sqliteviz](https://lana-k.github.io/sqliteviz/#/workspace)), to run queries on the database.
