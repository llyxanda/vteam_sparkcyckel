FROM ubuntu:24.04

RUN apt update && apt install -y curl jq iputils-ping

WORKDIR /client

RUN apt update && apt install -y iputils-ping

COPY package*.json /client/

RUN npm install

COPY . /client/

EXPOSE 8080

CMD ["node", "sim.mjs"]
