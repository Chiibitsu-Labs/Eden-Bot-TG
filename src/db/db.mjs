// src/db/db.mjs
import { JSONFilePreset } from 'lowdb/node';

export const initDb = async () => {
    const defaultData = { communities: {} };
    const db = await JSONFilePreset('db.json', defaultData);
    return db;
};
