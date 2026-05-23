import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../data/mockFirestore.json");

// Ensure data folder exists
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure mock db file exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), "utf8");
}

function readDB() {
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading mock Firestore:", error);
    return {};
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing mock Firestore:", error);
  }
}

class DocumentSnapshot {
  constructor(id, data) {
    this.id = id;
    this._data = data;
    this.exists = data !== undefined && data !== null;
  }

  data() {
    return this._data ? JSON.parse(JSON.stringify(this._data)) : undefined;
  }
}

class QuerySnapshot {
  constructor(docs) {
    this.docs = docs;
    this.size = docs.length;
  }

  forEach(callback) {
    this.docs.forEach(callback);
  }
}

class DocumentReference {
  constructor(collectionPath, id) {
    this.collectionPath = collectionPath;
    this.id = id;
  }

  async get() {
    const db = readDB();
    const collection = db[this.collectionPath] || {};
    const data = collection[this.id];
    return new DocumentSnapshot(this.id, data);
  }

  async set(data, options = {}) {
    const db = readDB();
    if (!db[this.collectionPath]) {
      db[this.collectionPath] = {};
    }

    const current = db[this.collectionPath][this.id] || {};
    let finalData = {};

    if (options.merge) {
      finalData = { ...current, ...data };
    } else {
      finalData = { ...data };
    }

    db[this.collectionPath][this.id] = finalData;
    writeDB(db);
    return { success: true };
  }

  async update(data) {
    const db = readDB();
    if (!db[this.collectionPath] || !db[this.collectionPath][this.id]) {
      throw new Error(`Document ${this.id} not found in collection ${this.collectionPath}`);
    }

    db[this.collectionPath][this.id] = {
      ...db[this.collectionPath][this.id],
      ...data,
    };
    writeDB(db);
    return { success: true };
  }

  async delete() {
    const db = readDB();
    if (db[this.collectionPath] && db[this.collectionPath][this.id]) {
      delete db[this.collectionPath][this.id];
      writeDB(db);
    }
    return { success: true };
  }
}

class Query {
  constructor(collectionPath, docs = null) {
    this.collectionPath = collectionPath;
    this.docs = docs;
  }

  _getDocs() {
    if (this.docs !== null) return this.docs;

    const db = readDB();
    const collection = db[this.collectionPath] || {};
    return Object.entries(collection).map(([id, data]) => {
      // Restore Date objects if they look like iso strings or timestamps
      const parsedData = JSON.parse(JSON.stringify(data));
      // Add fake toDate function to firestore timestamp objects if needed
      Object.keys(parsedData).forEach(key => {
        const val = parsedData[key];
        if (val && typeof val === "string" && (val.includes("T") || !isNaN(Date.parse(val)))) {
          parsedData[key] = {
            toDate: () => new Date(val),
            seconds: Math.floor(new Date(val).getTime() / 1000)
          };
        }
      });
      return { id, data: parsedData };
    });
  }

  where(field, op, val) {
    const currentDocs = this._getDocs();
    const filtered = currentDocs.filter((doc) => {
      let docVal = doc.data[field];
      // handle timestamps/toDate mock
      if (docVal && typeof docVal === "object" && typeof docVal.toDate === "function") {
        docVal = docVal.toDate();
      }

      let checkVal = val;
      if (checkVal && typeof checkVal === "object" && typeof checkVal.toDate === "function") {
        checkVal = checkVal.toDate();
      }

      if (op === "==") {
        if (docVal instanceof Date && checkVal instanceof Date) {
          return docVal.getTime() === checkVal.getTime();
        }
        return docVal === checkVal;
      }
      if (op === "!=") {
        return docVal !== checkVal;
      }
      if (op === ">") {
        return docVal > checkVal;
      }
      if (op === ">=") {
        return docVal >= checkVal;
      }
      if (op === "<") {
        return docVal < checkVal;
      }
      if (op === "<=") {
        return docVal <= checkVal;
      }
      if (op === "array-contains") {
        return Array.isArray(docVal) && docVal.includes(checkVal);
      }
      return false;
    });

    return new Query(this.collectionPath, filtered);
  }

  orderBy(field, direction = "asc") {
    const currentDocs = this._getDocs();
    const sorted = [...currentDocs].sort((a, b) => {
      let valA = a.data[field];
      let valB = b.data[field];

      if (valA && typeof valA === "object" && typeof valA.toDate === "function") {
        valA = valA.toDate();
      }
      if (valB && typeof valB === "object" && typeof valB.toDate === "function") {
        valB = valB.toDate();
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return new Query(this.collectionPath, sorted);
  }

  limit(count) {
    const currentDocs = this._getDocs();
    return new Query(this.collectionPath, currentDocs.slice(0, count));
  }

  offset(count) {
    const currentDocs = this._getDocs();
    return new Query(this.collectionPath, currentDocs.slice(count));
  }

  async get() {
    const currentDocs = this._getDocs();
    const docs = currentDocs.map(d => new DocumentSnapshot(d.id, d.data));
    return new QuerySnapshot(docs);
  }

  count() {
    const currentDocs = this._getDocs();
    return {
      get: async () => ({
        data: () => ({ count: currentDocs.length }),
        count: currentDocs.length
      })
    };
  }
}

class CollectionReference extends Query {
  constructor(collectionPath) {
    super(collectionPath);
  }

  doc(id) {
    const finalId = id || "doc_" + Math.random().toString(36).substr(2, 9);
    return new DocumentReference(this.collectionPath, finalId);
  }

  async add(data) {
    const id = "doc_" + Math.random().toString(36).substr(2, 9);
    const docRef = this.doc(id);
    await docRef.set(data);
    return docRef;
  }
}

export class MockFirestore {
  collection(name) {
    return new CollectionReference(name);
  }
}

export default MockFirestore;
