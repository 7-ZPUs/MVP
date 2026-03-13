FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

# Install Electron system dependencies (needed for headless / Xvfb builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    xvfb \
    && rm -rf /var/lib/apt/lists/* \
    npm install -g @angular/cli

# Install Angular CLI globally