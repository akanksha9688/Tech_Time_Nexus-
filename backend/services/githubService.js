const axios = require('axios');

exports.getPRCount = async (accessToken) => {
  try {
    // Step 1: Get user’s repositories
    const reposRes = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const repos = reposRes.data;
    let totalPRs = 0;

    // Step 2: For each repo, get the user's pull requests
    for (const repo of repos) {
      const pullsRes = await axios.get(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/pulls`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      // You can refine this logic to count only PRs made by the authenticated user
      totalPRs += pullsRes.data.filter(pr => pr.user.login === repo.owner.login).length;
    }

    return totalPRs;
  } catch (err) {
    console.error('Error fetching PR data from GitHub:', err.response?.data || err.message);
    throw err;
  }
};
