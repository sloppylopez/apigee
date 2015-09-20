#!/bin/bash
#Pre-requisites
curl -sL https://deb.nodesource.com/setup_0.12 | sudo bash -
sudo apt-get install -y -qq nodejs npm

#Install travis-cli command line to be able to encrypt api_keys in the Travis build
sudo gem install travis
#Encrypt your code climate key for Travis build and add it automatically to your .travis.yml
#remember explicitly declare this variables in
#https://travis-ci.org/<YOUR_GIT_USER>/<YOUR_GIT_PROJECT_NAME>/settings/env_vars
travis encrypt CODECLIMATE_REPO_TOKEN=<YOUR_CODE_CLIMATE_TOKEN> --add

#Fix for node first install http://stackoverflow.com/questions/21168141/can-not-install-packages-using-node-package-manager-in-ubuntu
sudo ln -s /usr/bin/nodejs /usr/bin/node

#Install npm global dependencies
sudo npm i -g jshint gulp apigee-127

#Check versions of installed dependencies
nodejs -v
npm -v
mocha --version
uname -r