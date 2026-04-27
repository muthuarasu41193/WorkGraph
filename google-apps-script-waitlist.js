/**
 * WorkGraph waitlist Google Apps Script endpoint.
 *
 * Setup:
 * 1) Create a new Apps Script project at https://script.google.com
 * 2) Paste this file into the editor as Code.gs
 * 3) Set SPREADSHEET_ID (or leave blank if script is bound to the sheet)
 * 4) Deploy -> New deployment -> Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5) Copy the /exec URL into GOOGLE_APPS_SCRIPT_URL in index.html
 */

const SPREADSHEET_ID = ''; // Optional: set to your spreadsheet ID.
const SHEET_NAME = 'WorkGraph Waitlist';
const HEADER_ROW = [
  'createdAt',
  'firstName',
  'email',
  'jobField',
  'country',
  'source',
  'timestamp',
  'page'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    message: 'Waitlist endpoint is live.'
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    if (!payload.email) {
      return jsonResponse_({
        ok: false,
        error: 'Missing required field: email'
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);

    try {
      const sheet = getTargetSheet_();
      ensureHeaders_(sheet);

      sheet.appendRow([
        new Date(),
        payload.firstName || '',
        payload.email || '',
        payload.jobField || '',
        payload.country || '',
        payload.source || 'landing_page',
        payload.timestamp || new Date().toISOString(),
        payload.page || ''
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse_({
      ok: true,
      message: 'Waitlist entry saved successfully.'
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: (error && error.message) ? error.message : String(error)
    });
  }
}

function getTargetSheet_() {
  const spreadsheet = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  if (!spreadsheet) {
    throw new Error('Spreadsheet not found. Set SPREADSHEET_ID in script.');
  }

  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, HEADER_ROW.length).getValues()[0];
  const isHeaderMissing = currentHeaders.every(function (value) { return !value; });
  if (isHeaderMissing) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  }
}

function parsePayload_(e) {
  if (!e) return {};

  // Preferred path for x-www-form-urlencoded submissions.
  if (e.parameter && Object.keys(e.parameter).length > 0) {
    return {
      firstName: clean_(e.parameter.firstName),
      email: clean_(e.parameter.email),
      jobField: clean_(e.parameter.jobField),
      country: clean_(e.parameter.country),
      source: clean_(e.parameter.source),
      timestamp: clean_(e.parameter.timestamp),
      page: clean_(e.parameter.page)
    };
  }

  // Fallback for JSON body submissions.
  if (e.postData && e.postData.contents) {
    try {
      const body = JSON.parse(e.postData.contents);
      return {
        firstName: clean_(body.firstName),
        email: clean_(body.email),
        jobField: clean_(body.jobField),
        country: clean_(body.country),
        source: clean_(body.source),
        timestamp: clean_(body.timestamp),
        page: clean_(body.page)
      };
    } catch (error) {
      throw new Error('Invalid request body. Expected form fields or JSON.');
    }
  }

  return {};
}

function clean_(value) {
  return value == null ? '' : String(value).trim();
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
