// config.js - Updated with Apps Script URL
const CONFIG = {
    // Your Google Sheet ID
    SHEET_ID: '1UXeJjBMeXSD0OfaLckJ3O4fXW5omKM8KLAUYsWXelkw', //blog master sheet
    
    // Google Sheets API Key (for reading only)
    API_KEY: 'AIzaSyDc8tegwi2rgHyDFYm7uWBqVqQ7Fwb3uWM',  // Replace with your restricted API key
    
    // Apps Script Web App URL (for writes - likes/comments)
    // DEPLOY THIS FIRST: Go to Extensions > Apps Script, paste code.gs, Deploy > New deployment > Web App
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwNUDaJ7NTZO6Kpa7WB66mbGXzbZ7uj2PnFj21vwChXfTyH5M9yzgSDHoCAHFd1EpuK/exec',
    
    // Sheet names
   
    SHEETS: {
        BLOG_DATA: 'blog data',
        COMMENTS_DATA: 'Comments data',
        CONFIGURE: 'configure',
        MASTER_CATEGORIES: 'master_categories',
        MASTER_TAGS: 'master_tags'
    }
};