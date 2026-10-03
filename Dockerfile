# Multi-stage build for the Next.js client.
#
# Build with this directory as the context:
#   docker build -t koliader/tellmi-client:v0.1.0 tellmi-client
#
# Not the repo root, unlike the three Go services. The client needs none of their
# sources, their compiled binaries or their module caches, and sending those to
# the daemon on every build would cost a great deal of time for nothing.
#
# The context is still large without the .dockerignore beside this file, because
# node_modules alone is bigger than the entire image.

# ---- deps -------------------------------------------------------------------
# Dependencies are installed in their own stage so the slow, rarely-changing
# install is not repeated when only application source changes.
FROM node:24-alpine AS deps

WORKDIR /app

# corepack provides the pnpm version the lockfile was written against, rather
# than whatever happens to be installed, so the install is reproducible. Run
# through sh because the base image has no shell set up for corepack.
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

# The lockfile, workspace manifest and package.json together decide the entire
# dependency tree, so they are copied first and alone. Any later change leaves
# this layer cached and skips the install entirely.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# `--frozen-lockfile` fails instead of silently updating the lockfile. A build
# allowed to rewrite it would produce an image whose contents nobody can
# reproduce from the repository.
RUN pnpm install --frozen-lockfile

# ---- build ------------------------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_API_URL is substituted into the client bundle at build time, so it
# must be present here. Setting it on the running container would have no effect.
# `/api` keeps every browser request on this origin, which the rewrite below then
# proxies server-side -- the same shape as development, so nothing has to behave
# differently in the cluster.
ARG NEXT_PUBLIC_API_URL=/api

# GATEWAY_ORIGIN is ALSO build-time, which is the trap in this file.
# `rewrites()` is evaluated during `next build` and serialised into
# .next/routes-manifest.json; `next start` re-reads next.config for other
# settings but does not re-run the rewrite. Verified by building with one value
# and starting the server with another -- the server still dialled the built one.
#
# So this cannot be a runtime env var. Moving the gateway means rebuilding the
# image, not restarting the pod. The default is the in-cluster Service DNS name,
# which is stable, so baking it in is safe; the port matches the gateway Service.
ARG GATEWAY_ORIGIN=http://gateway-service:8080

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    GATEWAY_ORIGIN=$GATEWAY_ORIGIN \
    NEXT_TELEMETRY_DISABLED=1

# `output: "standalone"` in next.config produces .next/standalone, with a
# minimal server.js and only the node_modules the build trace actually reached.
RUN pnpm build

# ---- runner -----------------------------------------------------------------
FROM node:24-alpine AS runner

WORKDIR /app

# PORT and HOSTNAME are read at runtime by the standalone server (per the Next
# deploying guide). 0.0.0.0 rather than the default localhost, or the Service
# cannot reach the container at all.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# What standalone does and does not give us:
#
#   server.js       the minimal server
#   node_modules    the traced subset, already inside standalone
#   .next/static    hashed client assets  -- NOT copied by standalone
#   public          files served at /public -- NOT copied by standalone
#
# The last two are copied by hand because standalone deliberately omits them on
# the assumption a CDN will serve them. Omitting them here fails as a blank page
# with every JS and CSS file 404ing, which is a confusing way to discover it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

# The next:alpine images ship a `node` user (uid 1000). Nothing in the final
# tree is written at runtime, so it needs no ownership beyond the COPY above.
USER node

EXPOSE 3000

CMD ["node", "server.js"]
