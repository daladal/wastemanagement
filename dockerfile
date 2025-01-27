FROM node:latest

RUN apt-get update && apt-get install -y curl dos2unix

WORKDIR /usr/src/app

COPY run.sh .
COPY extract.js .
RUN chmod +x run.sh extract.js

RUN npm install xlsx

CMD ["./run.sh"]