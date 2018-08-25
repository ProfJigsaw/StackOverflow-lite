import express from 'express';
import path from 'path';

const router = express.Router();

router.get('/', (req, res) => {
  res.send(`
  Welcome to StackOverflow-Lite!
  <p>To see the documetation of this API you can either: </p>
  <p>Follow <a href="/api-docs">this link<a> or Enter the following in the searchbar: <i>nweze-stackoverflow.herokuapp.com/api-docs.</i> </p>
  `);
});

router.get('/api-docs', (req, res) => {
  res.redirect('/api-docs');
});

router.get('/apidocs', (req, res) => {
  res.json({
    openapi: '3.0.1',
    info: {
      title: 'NWEZE VICTOR - StackOverflow-Lite Web Application',
      description: 'A mini Q & A web application',
      version: '0.1',
    },
    servers: [{
      url: 'https://nweze-stackoverflow.herokuapp.com',
    }],
    paths: {
      '/api/v1/questions/': {
        get: {
          description: 'Get all questions',
          responses: {
            200: {
              description: 'Successfully returned all questions in the database',
              content: {
                'application/json; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          description: 'Route to log a user in',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    password: {
                      type: 'string',
                    },
                    username: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  0: {
                    value: '{\n    "username": "jigsaw",\n    "password": "jig"\n}',
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successfully logged user in',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/signup': {
        post: {
          description: 'Route to sign a user in',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    password: {
                      type: 'string',
                    },
                    email: {
                      type: 'string',
                    },
                    username: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  0: {
                    value: '{\n    "username": "jamesy",\n    "email": "jamesy@gmail.com",\n    "password": "jam"\n}',
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Endpoint successfully sign in the new user',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/questions/10': {
        delete: {
          description: 'Route to delete a question (by questions author)',
          responses: {
            200: {
              description: 'Successfully deleted user',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/questions/24/answers': {
        post: {
          description: 'Route to post an answer to a particular question',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: {
                      type: 'string',
                    },
                    userid: {
                      type: 'integer',
                    },
                    username: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  0: {
                    value: '{\n    "username": "jigsaw",\n    "userid": 1,\n    "answer": "Life is soooo complex"\n}',
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successfully posted answer',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/questions/24/answers/1': {
        put: {
          description: 'Route to accept a particular answer (by questions author)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    userId: {
                      type: 'integer',
                    },
                  },
                },
                examples: {
                  0: {
                    value: '{\n    "userId": 3\n}',
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'successfully accepted a given question',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/questions': {
        post: {
          description: 'Route to post a new question into the database',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    question: {
                      type: 'string',
                    },
                    userId: {
                      type: 'integer',
                    },
                    username: {
                      type: 'string',
                    },
                  },
                },
                examples: {
                  0: {
                    value: '{\n    "username": "jiggyjiggy",\n    "userId": 54,\n    "question": "Who is fejiro?"\n}',
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Successfully add question into database',
              content: {
                'text/html; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
      '/api/v1/questions/24': {
        get: {
          description: 'Route to get a specific question',
          responses: {
            200: {
              description: 'Successfully returned specific question',
              content: {
                'application/json; charset=utf-8': {
                  schema: {
                    type: 'string',
                  },
                  examples: {},
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        oauth2: {
          type: 'oauth2',
          flows: {
            implicit: {
              authorizationUrl: 'http://yourauthurl.com',
              scopes: {
                scope_name: 'Enter your scopes here',
              },
            },
          },
        },
      },
    },
  });
});
export default router;
