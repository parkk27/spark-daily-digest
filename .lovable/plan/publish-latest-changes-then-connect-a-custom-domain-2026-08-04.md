# Publish latest changes, then connect a custom domain

## Goal

Ship the current frontend to the live URL so the custom domain can be attached to an up-to-date site. No code changes.

## Steps

1. Run a security scan of the backend and review the results.
2. If there are unresolved critical findings, stop and report them before deploying.
3. Publish the project to `bigdata-hub.lovable.app`.
4. Hand off the custom-domain setup: Project Settings, Project, Domains, Connect Domain.

## Notes

- Edge functions (`spark-scrape`, `spark-copilot`, `spark-trend-insights`, `mcp`) are already live and are unaffected by publishing.
- The custom domain must be attached through the Domains UI, which shows the DNS records unique to your domain. It cannot be done from here.
- Nothing in the codebase is modified by this plan.
