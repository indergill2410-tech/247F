import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import jobsRouter from "./jobs.js";
import claimsRouter from "./claims.js";
import notificationsRouter from "./notifications.js";
import dashboardRouter from "./dashboard.js";
import adminRouter from "./admin.js";
import conversationsRouter from "./conversations.js";
import reviewsRouter from "./reviews.js";
import stripeRouter from "./stripe.js";
import tradiesRouter from "./tradies.js";
import partnerEnquiryRouter from "./partner-enquiry.js";
import emergencyRouter from "./emergency.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(jobsRouter);
router.use(claimsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(conversationsRouter);
router.use(reviewsRouter);
router.use(stripeRouter);
router.use(tradiesRouter);
router.use(partnerEnquiryRouter);
router.use(emergencyRouter);

export default router;
