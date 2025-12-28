FROM node:22-alpine

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps
RUN npm run build

ENV NODE_ENV production

EXPOSE 3020

CMD ["npm", "run", "start"]
