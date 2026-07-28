// ================= SCHEMA TABLE CONFIGURATION =================
const SCHEMA_SPREADSHEET_ID = "1Q7fGIi2ky6b7cYt49ljwIwGEJv3kQ8pmz47bFaPBEDs";
const SCHEMA_TABLE_NAME = "Tables";
const SCHEMA_API_KEY = "AIzaSyDc8tegwi2rgHyDFYm7uWBqVqQ7Fwb3uWM";

// ================= MAIN SPREADSHEET CONFIGURATION =================
const SPREADSHEET_ID = "1Q7fGIi2ky6b7cYt49ljwIwGEJv3kQ8pmz47bFaPBEDs";
const API_KEY = "AIzaSyDc8tegwi2rgHyDFYm7uWBqVqQ7Fwb3uWM";

// ================= SHEET NAMES =================
const DEACTIVE_MEMBERS_SHEET = "Deactive_Members";
const MEMBERS_SHEET = "Members";

// ================= EXPORT FOR MODULE USE (if needed) =================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SCHEMA_SPREADSHEET_ID,
        SCHEMA_TABLE_NAME,
        SCHEMA_API_KEY,
        SPREADSHEET_ID,
        API_KEY,
        DEACTIVE_MEMBERS_SHEET,
        MEMBERS_SHEET
    };
}