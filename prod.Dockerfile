
# node base image
FROM node:12.2.0-alpine as build

# set working directory
RUN mkdir /specialToolUI

COPY . /specialToolUI

# working directory
WORKDIR /specialToolUI


# run npm install
RUN npm install 

RUN npm install --global webpack

RUN npm install --save ng-busy

# copy everything to current working directory 
#COPY . .

#RUN npm install -g @angular/cli
#RUN npm install  @angular-devkit/build-angular

#RUN  npm run build --prod --loglevel verbose
#RUN   node --max_old_space_size=4096 node_modules/@angular/cli/bin/ng build --prod
#RUN   node_modules/@angular/cli/bin/ng build --configuration=test

RUN npm run build:production

CMD ng serve  
# nginx base imagebuild

FROM nginx:1.16.0-alpine

# copy static contents of project to nginx html 
COPY --from=build /specialToolUI/dist/specialtoolui /usr/share/nginx/html

EXPOSE 80

#CMD ["nginx", "-g", "daemon off;"]