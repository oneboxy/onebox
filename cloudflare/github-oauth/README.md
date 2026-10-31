# GitHub OAuth Worker

This Worker handles OneBox's GitHub OAuth callback and token renewal.

## Deploy

Deploy this source to the existing `onebox-github-oauth` Worker. Keep its existing `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` secrets configured. The GitHub OAuth App callback URL must remain:

`https://onebox-github-oauth.secoder.workers.dev/auth/callback`

The Worker returns short-lived access-token metadata to OneBox and renews expiring tokens through GitHub's OAuth token endpoint. Refresh tokens are held only in the browser's local account record and are excluded from cloud sync.

After deployment, users who connected before refresh-token support must sign in once again so the OAuth callback can save the refresh token. This is needed only when the GitHub OAuth App is configured to issue expiring user tokens.
