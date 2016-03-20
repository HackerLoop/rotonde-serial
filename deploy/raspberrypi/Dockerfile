FROM resin/raspberrypi-node:latest

RUN sudo apt-get update && \
    sudo apt-get -y upgrade && \
    sudo apt-get install unzip

ADD https://github.com/HackerLoop/rotonde-serial/archive/master.zip /tmp
RUN unzip /tmp/master.zip -d /usr/local/ && mv /usr/local/rotonde-serial-master /usr/local/rotonde-serial

WORKDIR "/usr/local/rotonde-serial/"

RUN npm install

CMD ["/usr/local/bin/node", "index.js"]
