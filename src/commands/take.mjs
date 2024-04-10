// src/commands/take.mjs
import { modifyUserPoints } from '../utils/modifyUserPoints.mjs';

export const takeCommand = async (msg, bot, db) => {
    const amount = msg.text.split(' ')[2]; // Assuming the amount is the second argument
    const note = msg.text.split(' ').slice(3).join(' '); // Everything after the amount is considered part of the note
    await modifyUserPoints(msg, bot, db, amount, note, false);
};
