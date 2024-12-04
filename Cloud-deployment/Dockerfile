# Use Node.js 20 base image
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app will run on
EXPOSE 8000

# Start the application
CMD ["node", "server.js"]