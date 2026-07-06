import { getAuth } from "firebase/auth";
import app from "./client";

const auth = getAuth(app);

export { auth };
export * from "firebase/auth";
