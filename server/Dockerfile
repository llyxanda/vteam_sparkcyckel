FROM node

# Set the working directory inside the container
WORKDIR /server

# Install necessary system packages (for example, iputils-ping)
RUN apt update && apt install -y iputils-ping

COPY ./package*.json /client/
RUN npm install

# Copy the rest of the application code
COPY . /server/

# Expose port for the app
EXPOSE 8585

# Run the app using node
CMD ["node", "app.mjs"]
