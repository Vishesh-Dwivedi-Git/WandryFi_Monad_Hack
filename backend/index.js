import dotenv from "dotenv";
import express from "express";
import { ethers } from "ethers";
import cors from "cors";
import axios from "axios";

// Load environment variables from .env file
dotenv.config();

// Initialize the Express application
const app = express();

// Middleware for parsing JSON bodies and enabling CORS
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY;
const SECRET_API_KEY = process.env.API_KEY;

// Ensure essential environment variables are set
if (!VERIFIER_PRIVATE_KEY || !SECRET_API_KEY) {
  console.error("FATAL ERROR: Missing required environment variables.");
  process.exit(1); // Exit the process if the required secrets are not available
}

