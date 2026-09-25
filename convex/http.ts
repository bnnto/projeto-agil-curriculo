import { httpRouter } from "convex/server";
import { auth } from "./auth";

/**
 * Rotas HTTP do Convex Auth (issue [S1-1]) — obrigatórias para os fluxos de
 * verificação de JWT e sign-in/sign-out no cliente React.
 */
const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
