FROM ubuntu:24.04

RUN apt update && apt install -y curl jq iputils-ping

WORKDIR /client

COPY public ./public

COPY src ./src
