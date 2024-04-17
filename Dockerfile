# 1. Choose a lightweight Node.js base image 
FROM node:lts-alpine

RUN apk add texlive-full

# 2. Create a working directory inside the container
WORKDIR /app

# 3. Copy your application code
COPY package.json package-lock.json ./
COPY src ./

# 4. Install dependencies
RUN npm install

# 6. Specify the command to start your application
CMD [ "node", "bot.js" ] 
