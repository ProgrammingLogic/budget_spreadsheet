const startingRow = 4;
const startingColumn = 'A';
const endColumn = 'W';
const transactionSheetName = "Account Transactions";
const transactionTypesToSkip = ["Start", "Formulas"];


function onEdit(e) {
  if (e == null) {
    return;
  }

  if (e.source.getSheetByName(transactionSheetName) == null) {
    throw("ERROR: Sheet " + transactionSheetName + " does not exist!");
  }

  var sheet = e.source.getActiveSheet();
  var sheetName = sheet.getName();

  if (sheetName != transactionSheetName) {
    return;
  }

  sortTransactions(sheet);
  applyTransactionDefaults(sheet);
}


/**
 * @param {SpreadsheetApp.Sheet}
 * @param {String}
 */
function validateSheetName(sheet, expectedSheetName) {
  var sheetName = sheet.getName();

  if (sheetName != expectedSheetName) {
    throw("Sheet is not " + expectedSheetName + "!");
  }
}


/**
 * @param {SpreadsheetApp.Sheet} sheet
 */
function getTransactions(sheet) {
  validateSheetName(sheet, transactionSheetName);

  var lastRow = sheet.getLastRow();
  Logger.log("Last row: " + lastRow);

  var rangeA = sheet.getRange("A" + startingRow + ":A" + lastRow);
  var valuesA = rangeA.getValues();
  
  var rangeB = sheet.getRange("B" + startingRow + ":B" + lastRow);
  var valuesB = rangeB.getValues();

  if (valuesA.length != valuesB.length) {
    throw("valuesA.length (" + valuesA.length + 
      ") is not equal to valuesB.length (" + valuesB.length + "!");
  }

  var lastValidIndex = -1;

  for (var i = valuesA.length -1; i >= 0; i--) {
    var valueA = valuesA[i][0];
    var valueB = valuesB[i][0];

    if (typeof valueA == 'string' && valueA.trim() != '' && valueB instanceof Date) {
      lastValidIndex = i;
      break;
    }
  }

  var rangeString = startingColumn + startingRow + ":" +
    endColumn + sheet.getLastRow();
  Logger.log("Getting transactions at " + rangeString);

  var dataRange = sheet.getRange(rangeString);

  return dataRange;
}


/**
 * @param {SpreadsheetApp.Sheet}
 */
function sortTransactions(sheet) {
  validateSheetName(sheet, transactionSheetName);

  var dataRange = getTransactions(sheet);

  if (!dataRange.canEdit()) {
    throw("No permission to edit cells!");
  }

  Logger.log("Sorting transactions")
  dataRange.sort({column: 2, ascending: true});
}


/**
 * @param {SpreadsheetApp.Sheet}
 */
function applyTransactionDefaults(sheet) {
  validateSheetName(sheet, transactionSheetName);

  var dataRange = getTransactions(sheet);

  if (!dataRange.canEdit()) {
    throw "No permission to edit cells!";
  }

  var values = dataRange.getValues();

  // Range.getCell uses row/column coordinates relative to the range and not the Google sheet.
  //  This means we need to start at row 0 and column 0 to ensure we're touching the rows/columns.
  for (var x = 0; x < values.length; x++) {
    var row = values[x];
    Logger.log(`[x] row ${x}: "${row}"`)

    for (var y = 0; y < row.length; y++) {
      var column = row[y];

      // Offset indexes by one because Range indexes start at (1, 1).
      var headerRange = sheet.getRange(1, y + 1);
      var header = headerRange.getValue();

      Logger.log(`[x] col ${y} (header: ${header}): "${column}"`)


      if (header == "" || header == null) {
        continue;
      }

      var transactionType = row[0];

      if (typeof column != 'string') {
        // Logger.log(`[x] currentValue: "${column}" is not a string for (${startingRow + x}, ${y}) (transactionType: "${transactionType}", header: "${header})"`);
        continue;
      }

      if (column.trim() != "") {
        // Logger.log(`[x] currentValue: "${column}" is empty for (${startingRow + x}, ${y}) (transactionType: "${transactionType}", header: "${header})"`);
        continue;
      }

      var defaultValue = getDefaultValue(header, transactionType, startingRow + x + 1,  y + 1);
      var cell = sheet.getRange(startingRow + x + 1, y + 1);

      Logger.log(`[o] Attempting to apply defaultValue "${defaultValue}" for (${startingRow + x}, ${y}) (transactionType: "${transactionType}", header: "${header}", currentValue: "${column}")`);
    
      if (defaultValue.trim() == "") {
        Logger.log(`[x] defaultValue ("${defaultValue}") for transactionType: "${transactionType}", header: "${header}" is empty}`)
        return;
      }

      cell.setValue(defaultValue);
    }
  }
}


function getDefaultValue(header, transactionType, row, column) {
  var defaultValue = "";

  switch(header) {
    case "change SAVINGS":
      defaultValue = `=K${row} + L${row}`;
      break;
  }

  return defaultValue;
}
