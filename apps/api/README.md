# API (NestJS)

Scaffolded as `@money-split/api`.

The API contract, including authentication requirements, request schemas, query
options, validation rules, and response shapes, is documented in
[`../../docs/api/openapi.yaml`](../../docs/api/openapi.yaml). When the API is
running, the controller-generated Swagger UI is available at `/docs`.

Quick start:

```bash
pnpm install
pnpm dev:api
```

## Email verification configuration

Set these variables in the API process environment for local development and
in the hosting provider's environment settings for deployments:

- `RESEND_API_KEY`: API key for the Resend account.
- `EMAIL_FROM`: sender address on a domain verified with Resend.
- `API_PUBLIC_URL`: public HTTPS base URL for this API (localhost HTTP is
  allowed for local development).

The API does not include these values in the repository. Registration and
verification emails require all three settings. Group invitation emails require
`RESEND_API_KEY` and `EMAIL_FROM`; if delivery is unavailable, the invitation
code is still created and returned in the app so it can be shared manually.
Restart or redeploy the API after changing its environment.

## Push notifications

The app stores notification inbox entries for group expense and settlement
updates. Mobile push delivery uses Firebase Cloud Messaging (FCM):

- Add the Firebase Android app's `google-services.json` to
  `apps/mobile/android/app/`.
- Add the Firebase iOS app's `GoogleService-Info.plist` to the iOS app target,
  enable the Push Notifications capability, and configure APNs in Firebase.
- Run `pnpm install` and `cd apps/mobile/ios && pod install` after installing
  the mobile Firebase packages.
- Configure Firebase Admin credentials for the API runtime using Application
  Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`. Keep service-account
  credentials out of the repository.
- Apply the push-token migration with
  `pnpm --filter @money-split/api exec prisma migrate deploy`.

The mobile app asks permission before registering its device. Until both the
mobile Firebase app files and API Firebase Admin credentials are configured,
notification inbox entries still work; push delivery is unavailable.

DB commands (root):

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:studio
```

## Docker deployment

From the repository root, build with the repository as the Docker context and
the root `Dockerfile`:

```bash
docker build -t money-split-api .
```

The API depends on workspace packages and the root `pnpm-lock.yaml`, so do not
use `apps/api` as the build context.

For Render, configure the Docker service with the repository root as its
**Root Directory** (leave it blank) and the root `Dockerfile` as its
**Dockerfile Path**. Do not set `apps/api` as the Root Directory: Render would
then omit the workspace lockfile and packages from the Docker build context.

Run the Docker build locally from the repository root to verify the context:

```bash
docker build -t money-split-api .
```
