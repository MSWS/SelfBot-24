# 1. Choose a lightweight Node.js base image 
FROM node:lts-alpine

# 2. Create a working directory inside the container
WORKDIR /app

# 3. Copy your application code
COPY package.json package-lock.json tsconfig.json ./
COPY src src

# 4. Install dependencies
RUN npm install
RUN npm run build

# 6. Specify the command to start your application
CMD [ "npm", "run", "start"]