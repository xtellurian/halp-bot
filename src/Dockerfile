FROM ubuntu:16.04 as builder
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_10.x | bash && \
    apt-get install -y git nodejs build-essential
RUN npm install -g node-gyp && \
    npm install -g typescript
WORKDIR /build
COPY halp/package.json .
RUN npm install
COPY halp .
RUN npm run build 


FROM node:10-alpine 
WORKDIR /app/
COPY --from=builder /build .
ENTRYPOINT [ "node", "js/app.js" ]