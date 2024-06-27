# Gunakan image node sebagai base
FROM node:14

# Set working directory
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Salin semua file proyek
COPY . .

# Expose port 3000
EXPOSE 3000

# Jalankan aplikasi
CMD ["node", "index.js"]
