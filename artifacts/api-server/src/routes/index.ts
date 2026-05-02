import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import jobsRouter from "./jobs.js";
import claimsRouter from "./claims.js";
import notificationsRouter from "./notifications.js";
import dashboardRouter from "./dashboard.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(jobsRouter);
router.use(claimsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
