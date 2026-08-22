// ==================== SCHEMA MANAGER API ====================
// Deploy as Web App (Execute as: "Me", Access: "Anyone")
// Spreadsheet ID: 1Q7fGIi2ky6b7cYt49ljwIwGEJv3kQ8pmz47bFaPBEDs

const SPREADSHEET_ID = "1Q7fGIi2ky6b7cYt49ljwIwGEJv3kQ8pmz47bFaPBEDs";
const SHEET_NAME = "Tables";

function doPost(e) {
  // Set CORS headers for response
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  
  try {
    let requestData;
    if (e.postData.type === "application/json") {
      requestData = JSON.parse(e.postData.contents);
    } else {
      requestData = JSON.parse(e.postData.getDataAsString());
    }
    
    const action = requestData.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    let result;
    switch(action) {
      case "ADD_COLUMN":
        result = handleAddColumn(ss, requestData);
        break;
      case "UPDATE_COLUMN":
        result = handleUpdateColumn(ss, requestData);
        break;
      case "DELETE_COLUMN":
        result = handleDeleteColumn(ss, requestData);
        break;
      default:
        result = { status: "error", error: "Unknown action: " + action };
    }
    
    return createResponse(result, corsHeaders);
    
  } catch(error) {
    return createResponse({ 
      status: "error", 
      error: error.toString(),
      stack: error.stack 
    }, corsHeaders);
  }
}

// Handle GET requests and OPTIONS preflight
function doGet(e) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
  
  return createResponse({ 
    status: "success", 
    message: "Schema Manager API is running",
    operations: ["ADD_COLUMN", "UPDATE_COLUMN", "DELETE_COLUMN"]
  }, corsHeaders);
}

// ==================== HANDLE ADD COLUMN ====================
function handleAddColumn(ss, data) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Get current data to find the last column
  const rangeData = sheet.getDataRange().getValues();
  let maxCols = 0;
  if (rangeData.length > 0) {
    maxCols = rangeData[0].length;
  }
  
  // Get current headers
  let headers = [];
  if (rangeData.length > 0 && rangeData[0].length > 0) {
    headers = rangeData[0];
  }
  
  // Check if column name already exists
  if (headers.includes(data.columnName)) {
    throw new Error("Column name already exists: " + data.columnName);
  }
  
  // Add new column
  const newColIndex = maxCols + 1;
  
  // Write header in first row
  if (sheet.getLastRow() === 0) {
    // If sheet is empty, just set header
    sheet.getRange(1, newColIndex).setValue(data.columnName);
  } else {
    // Insert a new column at the end
    sheet.insertColumnAfter(maxCols);
    sheet.getRange(1, newColIndex).setValue(data.columnName);
  }
  
  // Add values from the second row onwards
  if (data.values && data.values.length > 0) {
    const startRow = 2; // Start from row 2
    data.values.forEach((value, index) => {
      const rowNum = startRow + index;
      sheet.getRange(rowNum, newColIndex).setValue(value);
    });
  }
  
  return { 
    status: "success", 
    message: "Column added successfully",
    columnName: data.columnName,
    columnIndex: newColIndex
  };
}

// ==================== HANDLE UPDATE COLUMN ====================
function handleUpdateColumn(ss, data) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Sheet not found");
  }
  
  const columnIndex = data.columnIndex;
  if (columnIndex === undefined || columnIndex === null) {
    throw new Error("Column index missing");
  }
  
  const rangeData = sheet.getDataRange().getValues();
  if (rangeData.length === 0) {
    throw new Error("Sheet is empty");
  }
  
  // Column index is 0-based, convert to 1-based for sheet operations
  const colNum = columnIndex + 1;
  const maxRow = rangeData.length;
  
  // Update header
  if (data.newName) {
    sheet.getRange(1, colNum).setValue(data.newName);
  }
  
  // Update values - clear existing values from row 2 to maxRow
  if (maxRow > 1) {
    sheet.getRange(2, colNum, maxRow - 1, 1).clearContent();
  }
  
  // Write new values
  if (data.values && data.values.length > 0) {
    data.values.forEach((value, index) => {
      const rowNum = 2 + index;
      sheet.getRange(rowNum, colNum).setValue(value);
    });
  }
  
  return { 
    status: "success", 
    message: "Column updated successfully",
    columnName: data.newName || data.oldName,
    columnIndex: columnIndex
  };
}

// ==================== HANDLE DELETE COLUMN ====================
function handleDeleteColumn(ss, data) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    throw new Error("Sheet not found");
  }
  
  const columnIndex = data.columnIndex;
  if (columnIndex === undefined || columnIndex === null) {
    throw new Error("Column index missing");
  }
  
  // Column index is 0-based, convert to 1-based for sheet operations
  const colNum = columnIndex + 1;
  const lastCol = sheet.getLastColumn();
  
  // Delete the column
  if (colNum <= lastCol) {
    sheet.deleteColumn(colNum);
  }
  
  return { 
    status: "success", 
    message: "Column deleted successfully",
    columnName: data.columnHeader || "Column",
    columnIndex: columnIndex
  };
}

// ==================== CREATE RESPONSE ====================
function createResponse(data, corsHeaders) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  if (corsHeaders) {
    for (const key in corsHeaders) {
      output.setHeader(key, corsHeaders[key]);
    }
  }
  
  return output;
}

// ==================== INITIALIZE SHEETS ====================
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // Check if sheet has headers
  if (sheet.getLastRow() === 0) {
    // Add default headers with sample data
    const headers = [
      "Branch", "Home ID", "Area", "Location", "Post Office", 
      "District", "Relation", "Gender", "Education", "Jobs", 
      "Marital status", "Deactivation Reasons"
    ];
    
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Add sample data
    const sampleData = [
      ["", "", "Vpl", "VPL1", "VPL", "TVM", "Father", "Male", "SSLC", "Self-employed", "Married", ""],
      ["", "", "", "", "PYD", "", "Mother", "Female", "PlusTWO", "Private", "Non-Married", "Deceased"],
      ["", "", "", "", "", "", "Son", "Trans-Gender", "Degree", "PSU", "Divorced", "Left the area"],
      ["", "", "", "", "", "", "Daughter", "other", "PG", "Gov", "", "Transferred"],
      ["", "", "", "", "", "", "", "", "Engineering", "", "", "Retired"],
      ["", "", "", "", "", "", "", "", "", "", "", "Medical reasons"],
      ["", "", "", "", "", "", "", "", "", "", "", "Family reasons"],
      ["", "", "", "", "", "", "", "", "", "", "", "Other"],
      ["", "", "", "", "", "", "", "", "", "", "", "Resigned"],
      ["", "", "", "", "", "", "", "", "", "", "", "Moved away"]
    ];
    
    sampleData.forEach(row => {
      sheet.appendRow(row);
    });
  }
  
  return "Schema initialized successfully!";
}