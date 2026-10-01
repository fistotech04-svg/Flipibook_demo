FROM node:22-bookworm

WORKDIR /app

# Install system utilities
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    assimp-utils \
    inkscape \
    libreoffice-writer \
    libreoffice-impress \
    fonts-dejavu-core \
    fonts-liberation && \
    rm -rf /var/lib/apt/lists/*

# Linux binary paths
ENV PORT=5000
ENV ASSIMP_PATH=/usr/bin/assimp
ENV INKSCAPE_PATH=/usr/bin/inkscape
ENV LIBREOFFICE_PATH=/usr/bin/soffice

# Verify installations during Docker build
RUN which assimp && assimp version && \
    which inkscape && inkscape --version && \
    which soffice && soffice --version

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p \
    temp_uploads/pdf_uploads \
    temp_uploads/flipbook_assets \
    temp_uploads/branding_assets \
    uploads

EXPOSE 5000

CMD ["npm", "start"]