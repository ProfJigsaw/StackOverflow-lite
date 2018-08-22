[![Build Status](https://travis-ci.org/ProfJigsaw/StackOverflow-lite.svg?branch=feature)](https://travis-ci.org/ProfJigsaw/StackOverflow-lite)
[![Maintainability](https://api.codeclimate.com/v1/badges/f7236c27c148d101bf35/maintainability)](https://codeclimate.com/github/ProfJigsaw/StackOverflow-lite/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/f7236c27c148d101bf35/test_coverage)](https://codeclimate.com/github/ProfJigsaw/StackOverflow-lite/test_coverage)
[![Coverage Status](https://coveralls.io/repos/github/ProfJigsaw/StackOverflow-lite/badge.svg?branch=feature)](https://coveralls.io/github/ProfJigsaw/StackOverflow-lite?branch=feature)

# StackOverflow-lite
This web application is a `lite` weight version the popular [StackExchange](https://stackexchange.com) branch of the same name. It uses the popular JavaScript runtime environment, `NodeJs` and runs `express` at the backend.
All codes are written in `ES6` syntax and transpiled using the BabelCLI to a preset `ES2015`. 

## The User Interface
This part of the project is the graphical part of the app constructed with `HTML`, `CSS` and `JavaScript`. It is concerned with all that the user can see/view whenever they visit the web app. 

### Some of the features include:
- Viewing `recently posted questions` on the platform.
- A list of questions they recently posted on the platform and the question count.
- A `sign up` and `Log In` form to be used appropriately.
- A `profile page` for users with account, e.t.c

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites
To install this API on your your machine, you need to first clone this repository or download the zip file. Once this is set up, you are going to need the following packages
```
[NodeJs]
[Node Package Installer - NPM]
```

### Installing

Installing this application is fairly straightforward. After cloning this repository to your local environment, CD into the package folder on your favorite terminal... bash, command prompt or the like and run the following:

> npm install

This would essentially install all the development dependencies on your machine. Some of the major dependencies include@

```
Express - for creating a server
Mocha, Chai, supertest, istanbul, nyc - for testing and coverage reporting
pg - for connecting to a postgres database
jsonwebtoken - for user authentication
eslint, airbnb - for styling syntax
babel and its dependencies - for transpiling es6 code to a preset env of es2015
```

Once the installation is complete, we run the start script as follows:

> npm start

This runs the background processes;

```
nodemon app.js --exec babel-node --presets babel-preset-es2015
```

## Running the tests

To run test we simply run the following command on the command prompt

> npm test

This runs the following script on the background processes:

```
cross-env NODE_ENV=test nyc --reporter=html --reporter=text mocha --compilers js:babel-core/register --exit
```


## Deployment

This app is deployed on the popular hosting cloud platform [heroku](https://heroku.com). The app can be visited on [nweze-stackoverflow](https://nweze-stackoverflow.herokuapp.com).


## Versioning

This API makes use of the [express-url-versioning](https://www.npmjs.com/package/express-api-versioning) tool.

## Author

* **Nweze Victor Chinweudo** - *Initial work*


## License

This project is licensed under the MIT License [License](https://opensource.org/licenses/MIT)

## Acknowledgments

* Hat tip to all open source developer outthere making the world a better place
* Regards to the AndelaNG team for making this a reality for me
