/** GitHub token from httpOnly cookie (OAuth) or X-Github-Token header (PAT). */
function getGitHubToken(req) {
  return req.cookies?.github_token || req.headers["x-github-token"] || null;
}

module.exports = getGitHubToken;
