import { cronJobs } from "convex/server";

/**
 * Crons do sistema — [S0-3].
 * O cron de expiração de vagas (R4, 30 dias) será declarado na [S3-2].
 * Referência: CEREBRO.md §4.2.
 */
const crons = cronJobs();

export default crons;
