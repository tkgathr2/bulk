import { Router } from "express";
import googleRouter from "./google.js";
import slackRouter from "./slack.js";
import dropboxRouter from "./dropbox.js";

const router = Router();

router.use("/google", googleRouter);
router.use("/slack", slackRouter);
router.use("/dropbox", dropboxRouter);

export default router;
