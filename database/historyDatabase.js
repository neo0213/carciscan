import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("carciscan.db");

// to create table
export const createTable = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_name TEXT,
        scan_date TEXT,
        ingredients TEXT,
        ocr_text TEXT,
        api_result TEXT
      )
    `);
    console.log("History table ready");
  } catch (error) {
    console.log("Create table error:", error);
  }
};

// **RESET TABLE FUNCTION**
export const resetTable = () => {
  try {
    db.execSync("DROP TABLE IF EXISTS history");
    console.log("Dropped old history table");
    createTable();
  } catch (error) {
    console.log("Reset table error:", error);
  }
};

/* INSERT HISTORY */
// In historyDatabase.js - add to insertHistory:
/* INSERT HISTORY - no imageUri */
export const insertHistory = (ingredients, ocrText, apiResult) => {
  try {
    db.runSync(
      `INSERT INTO history (scan_date, ingredients, ocr_text, api_result)
       VALUES (?, ?, ?, ?)`,
      [
        new Date().toISOString(),
        JSON.stringify(ingredients),
        ocrText ?? null,
        JSON.stringify(apiResult)
      ]
    );
    console.log("Insert success, ingredients:", ingredients?.length);
  } catch (error) {
    console.log("Insert history error:", error);
  }
};
/* GET HISTORY */
export const getHistory = () => {
  try {
    return db.getAllSync("SELECT * FROM history ORDER BY id DESC");
  } catch (error) {
    console.log("Fetch history error:", error);
    return [];
  }
};

/* DELETE ONE */
export const deleteHistory = (id) => {
  try {
    db.runSync("DELETE FROM history WHERE id = ?", [id]);
  } catch (error) {
    console.log("Delete history error:", error);
  }
};

/* CLEAR ALL */
export const clearHistory = () => {
  try {
    db.runSync("DELETE FROM history");
  } catch (error) {
    console.log("Clear history error:", error);
  }
};

export const updateScanName = (id, newName) => {
  db.runSync(
    `UPDATE history SET scan_name = ? WHERE id = ?`,
    [newName, id]
  );
};