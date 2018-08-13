import chai from 'chai';
import server from '../app';
import request from 'supertest';

import mode from '../api/v1/helpers/mode'
import getUserId from '../api/v1/helpers/getUserId'
import genUniqueId from '../api/v1/helpers/genUniqueId'
import getUserEmail from '../api/v1/helpers/getUserEmail'

const expect = chai.expect;
var should = chai.should();

describe('Helper function tests', ()=>{
	it('Mode should return the number with greatest frequency', ()=>{
		expect(mode([1,1,1,1,2,3,4,1,1,1,3])).to.equal(1);
	});

	it('genUniqueId should generate a unique id', ()=>{
		expect(genUniqueId([{a:1}],"a")).to.equal(2);
	});
	it('genUniqueId should default to a value of 1, if key not found', ()=>{
		expect(genUniqueId([{a:1}],"unknownkey")).to.equal(1);
	});

	it('getUserEmail should generate user email from an array of objects', ()=>{
		expect(getUserEmail([{
			username: "Jigsaw",
			email: "dhagodfather@gmail.com",
			password: "tfu4vucker",
			userId: 1,
		}], "Jigsaw")).to.equal("dhagodfather@gmail.com");
	});
	it('getUserEmail should return an empty string if key not found in array of objects', ()=>{
		expect(getUserEmail([{
			username: "Jigsaw",
			email: "dhagodfather@gmail.com",
			password: "tfu4vucker",
			userId: 1,
		}], "fakeusername")).to.equal("");
	});

	it('getUserId should return a users id from an array', ()=>{
		expect(getUserId([{
			username: "Jigsaw",
			email: "dhagodfather@gmail.com",
			password: "tfu4vucker",
			userId: 1,
		}],"Jigsaw")).to.equal(1)
	});
	it('getUserId should return a default of 0 if key not found in an array', ()=>{
		expect(getUserId([{
			username: "Jigsaw",
			email: "dhagodfather@gmail.com",
			password: "tfu4vucker",
			userId: 1,
		}],"anotherfakeuser")).to.equal(0)
	});

});

describe('API URL versioning:', ()=>{
	it('it should hit the client homepage', done=>{
		request(server)
		.get('/').expect(200).end(done);
	});
	it('it should return an HTTP not found 404 error', done=>{
		request(server)
		.get('/api').expect(404).end(done);
	})
	it('it should be redirected with the location header of /api/v1/user, with status 302', (done)=>{
		request(server)
		.get('/api/v1')
		.expect('Location', /\/user/)
		.expect(302).end(done);
	});
	it('it should not be found, v2 doesnt exist', done=>{
		request(server)
		.get('/api/v2').expect(404).end(done);
	});
	it('it should load the user homepage successfully', done=>{
		request(server)
		.get('/api/v1/user').expect(200).end(done);
	})
});

describe('API Endpoints',()=>{
	it('it should get the total questions', done=>{
		request(server)
		.get('/api/v1/questions')
		.expect(200).end(done);
	});
	it('it should get the specified question successfully', done=>{
		request(server)
		.get('/api/v1/questions/2')
		.expect(200).end(done);
	})
	it('it should should throw an http 404 error when requesting non existent thread', done=>{
		request(server)
		.get('/api/v1/questions/questionThread/1222')
		.expect(404).end(done);
	})
	it('it should post a question successfully, redirect successfully', done=>{
		request(server)
		.post('/api/v1/questions')
		.send({
			username: "victor",
			userId: 3,
			question: "what is life?"
		})
		.expect(302).end(done);
	})
})