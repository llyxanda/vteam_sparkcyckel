FROM node

WORKDIR /server

RUN apt update && apt install -y iputils-ping

RUN npm init -y

RUN npm install express ejs

COPY config ./config

COPY routes ./routes

COPY views ./views

COPY app.mjs .

EXPOSE 8585

CMD ["node", "app.mjs"]