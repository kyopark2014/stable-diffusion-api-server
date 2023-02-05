FROM node:8

# Create app directory
WORKDIR /usr/src/app

#COPY package*.json ./

RUN npm install -S request
RUN npm install -S express
RUN npm install winston winston-daily-rotate-file date-utils winston-timestamp-colorize

COPY . .

EXPOSE 8000
CMD [ "npm", "start" ]