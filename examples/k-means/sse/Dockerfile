FROM node:10-alpine

WORKDIR /usr/src/app

COPY ./ .

RUN npm install --no-optional --no-package-lock

EXPOSE 50051

CMD [ "node", "index.js" ]

