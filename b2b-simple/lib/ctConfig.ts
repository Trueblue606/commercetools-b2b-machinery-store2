export const projectKey = process.env.CT_PROJECT_KEY || "";
export const scope = process.env.CT_SCOPE || `manage_project:${projectKey}`;
export default { projectKey, scope };
