const micro = require('micro');
const request = require('supertest');

const example = require('./example.js');
const server = micro(example)
const agent = request.agent(server)

describe('Request Server Endpoints', async () => {
    describe('GET /', () => {
        it(`returns status code 200`, (done) => {
            agent
                .get('/')
                .expect(200)
                .end(function(err, res) {
                    if (err) return done(err);
                    //console.info(res.text)
                    done();
                  });          
          })
    })
})
      