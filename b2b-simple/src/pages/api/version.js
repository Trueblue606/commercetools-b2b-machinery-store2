export default function handler(req, res) {
  res.status(200).json({
    branch: process.env.AWS_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || null,
    commit: process.env.AWS_COMMIT_ID || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA || null,
    builtAt: process.env.BUILD_TIME || null,
    node: process.version,
  });
}
