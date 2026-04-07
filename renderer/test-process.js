const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/workspaces/MVP/db/database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the database.');
  db.get("SELECT integrity_status as integrityStatus FROM process WHERE id = 1", (err, row) => {
      console.log("Process 1 status:", row);
  });
  db.get("SELECT integrity_status as integrityStatus FROM document WHERE id = 1", (err, row) => {
      console.log("Document 1 status:", row);
  });
});
