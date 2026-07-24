import { getFirestore } from "firebase/firestore";
import app from "./client";

const db = getFirestore(app);

export { db };
export * from "firebase/firestore";
