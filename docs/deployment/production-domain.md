# Production domain

Owner-required public origin: **https://adiguneplanai.hephzibahbehulah.com/**.

Migration source supplied by owner: https://hephzibahbehulahhq.github.io/adigunEplanAI/.

Cloudflare manages the public domain/DNS configuration. Supabase supports the approved authentication/cloud milestone. Production URLs, auth Site URL and permitted production redirects must use the required origin. Configure only actual implemented callback routes. Keep production redirect entries explicit; do not use a blanket wildcard.

## Current evidence

- No Cloudflare administration connector, CLI or credential environment variable was found in this session. No DNS mutation has been performed.
- The Supabase connector lists VoltPRo and HephzibahBehulahHQ projects. Neither is explicitly named AdigunEplanAI; no existing project's auth settings or database were changed. Project ownership/tenant architecture must be verified before choosing an existing shared backend or provisioning a dedicated one.
- The repository CI currently verifies builds/tests; it does not deploy. The GitHub connector's generic fetch endpoint does not permit the Pages-settings resource, so remote Pages/custom-domain settings remain unverified.
- Custom-domain HTTPS, DNS resolution, old-address redirection, Supabase redirect acceptance and cloud round trips are not yet verified.

## Configuration and acceptance

Configure the actual hosting origin and associate the custom domain before changing DNS. If GitHub Pages remains the origin, set its custom-domain setting first; the Cloudflare subdomain CNAME target is `hephzibahbehulahhq.github.io` without the repository path. A CNAME artifact alone does not configure custom Actions-based Pages deployments. If the approved deployment uses Cloudflare Pages/Workers, use that deployment's assigned custom-domain target.

After selecting the verified AdigunEplanAI Supabase backend, configure Auth Site URL to the required HTTPS origin and allow the actual application's production redirect URLs. Verify sign-in/sign-out, confirmation/recovery callbacks, access isolation, persistence and reload on the real domain in the cloud/auth milestone. Never place privileged Supabase keys in frontend configuration.

Release acceptance requires valid DNS and TLS, a successful production asset load at the domain root, correct application/auth links, the intended old-address transition, and authenticated cloud-project round trips. Record deployed commit, hosting origin, backend project and verification results when those operations are completed.

Sources: [GitHub custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [Supabase redirect documentation](https://supabase.com/docs/guides/auth/redirect-urls).
