FROM node:20-alpine

WORKDIR /backend

COPY package*.json ./

RUN npm ci --only=production 


COPY src ./src 

EXPOSE 3001

CMD ["npm", "start"] 