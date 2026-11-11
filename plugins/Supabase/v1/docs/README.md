Monitor your [Supabase](https://supabase.com) projects and Edge Functions in SquaredUp, including project and service health, security and performance advisors, API and function traffic, backups and database resource usage. The plugin uses the [Supabase Management API](https://supabase.com/docs/reference/api/introduction).

## Setup

You need a Supabase **personal access token**. One token covers every organization and project it can reach.

1. Sign in to the [Supabase dashboard](https://supabase.com/dashboard).
2. Open **Account preferences → [Access Tokens](https://supabase.com/dashboard/account/tokens)** and generate a new token.
3. Scope the token to the organizations and projects to monitor, and grant **Read** access to these permissions:
    - **Projects (account-wide)**
    - **Project Settings**
    - **Edge Functions**
    - **Advisors**
    - **Usage Analytics**
    - **Logs**
    - **Backups**
4. Set an expiry that suits you. When the token expires the plugin stops collecting data until you paste in a new one.
5. Copy the token, which starts with `sbp_`, and paste it into the **Personal access token** field.

See [Personal access tokens](https://supabase.com/docs/guides/platform/personal-access-tokens) in the Supabase docs for more on scoping.

## Configuration fields

| Field | What it is | Where to find it | Required |
| --- | --- | --- | --- |
| **Personal access token** | Authenticates every request to the Supabase Management API as a bearer token. | Supabase dashboard → **Account preferences → Access Tokens**. | Yes |

On save, the plugin lists the projects the token can see. An invalid or expired token fails the **Authenticate** step. A token that can't see any projects fails **Check project access**.

## What this plugin monitors

<!-- finalized in Phase 9 -->

## Data streams

<!-- finalized in Phase 9 -->

## What gets indexed

<!-- finalized in Phase 9 -->

## Known limitations

<!-- finalized in Phase 9 -->
