FROM oven/bun:1.1.34-alpine

ARG TARGETARCH
ARG TARGETPLATFORM

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

# Set TARGET_ARCH based on the build platform
RUN if [ "$TARGETARCH" = "amd64" ]; then \
      export TARGET_ARCH="bun-linux-x64"; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
      export TARGET_ARCH="bun-linux-arm64"; \
    else \
      export TARGET_ARCH="bun-linux-x64"; \
    fi && \
    bun build --compile --minify --sourcemap ./src/runner.ts --outfile seda-pusher --target=${TARGET_ARCH}

RUN chmod +x seda-pusher

ENTRYPOINT ["./seda-pusher"]
