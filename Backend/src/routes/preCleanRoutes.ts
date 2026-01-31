import express from "express";
import { triggerPreClean } from "../controllers/preCleanController";

const router = express.Router();

router.post("/", triggerPreClean);

export default router;
