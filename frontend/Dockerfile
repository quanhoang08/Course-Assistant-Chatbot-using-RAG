FROM node:20-alpine

WORKDIR /app

# Copy file package để tận dụng cache của Docker tầng install
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

# Chạy với flag --host để cho phép truy cập từ bên ngoài container
CMD ["npm", "run", "dev", "--", "--host"]
