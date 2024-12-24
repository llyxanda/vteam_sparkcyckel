FROM node

WORKDIR /server

RUN apt update && apt install -y iputils-ping

COPY package*.json /server/

RUN npm init -y

RUN npm install express ejs

COPY . /server/

# COPY config ./config

# COPY routes ./routes

# COPY views ./views

# COPY app.mjs .

EXPOSE 8585

# CMD ["bash"]

CMD ["node", "app.mjs"]