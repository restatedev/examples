# pull official base image
FROM node:14.17.3-alpine

# set working directory
WORKDIR /app

# add `/node_modules/.bin` to $PATH
ENV PATH /node_modules/.bin:$PATH

# install app dependencies
COPY package*.json .
RUN npm install

# add app
COPY . ./

EXPOSE 3000
# start app
CMD ["npm", "start"]
