import express from 'express'
import path, { dirname } from "path";
import { fileURLToPath } from "url";


const router = express.Router()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
  });

  export default router;