FROM node:8

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -S express
RUN npm install -S python-shell
RUN npm install winston winston-daily-rotate-file date-utils winston-timestamp-colorize

COPY . .

EXPOSE 8080
CMD [ "npm", "start" ]