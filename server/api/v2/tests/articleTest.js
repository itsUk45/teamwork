// test for article operations
import chai from 'chai';
import chaiHttp from 'chai-http';
import { after } from 'mocha';
import app from '../../../../app';
import { GenerateTokens } from '../helpers/jwtAuthHelper';
import data from '../data/data';
import User from '../models/User';

chai.use(chaiHttp);
const { expect } = chai;
const { firstName, lastName, email } = data[0];
const {
  atUserId, atFirstName, atLastName, atEmail, atPassword, atCreatedOn,
} = data[4];
let tokens;
let notOwnerTokens;
describe('Article test cases /api/v2/', () => {
  // post article test
  before(async () => {
    // create new test user to avoid foreign key constraint error
    const newUser = new User(atUserId, atFirstName, atLastName, atEmail, atPassword,
      null, null, null, null, atCreatedOn);
    await newUser.createUser();
    tokens = GenerateTokens(atUserId, firstName, lastName, email);
    notOwnerTokens = GenerateTokens(2, firstName, lastName, email); // notice the id is 2
  });
  after(async () => {
    // delete the test user so we can have a clean test in the next run
    await User.deleteUser(atEmail);
  });
  describe('POST /articles', () => {
    const url = '/api/v2/articles';
    it('deny access to articles route when no access tokens is provided', (done) => {
      chai
        .request(app)
        .post(url)
        // .set('x-auth-token', `Bearer ${tokens}`) dont provie access tokens
        .send({
          title: 'first title post',
          article: 'first article body',
        })
        .end((err, res) => {
          expect(res.body.error).to.equal('operation denied, authentication failed ');
          expect(res).to.have.status(401);
          done();
        });
    });

    it('deny access to articles route  when malformed access token is given', (done) => {
      const malformedTokens = 'qeqrlkhjgmngmbnd;ghjjfgjkhsjsfgjfhdfgjgf';
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${malformedTokens}`) // json verifcation fails here during verify() at auth middleware
        .send({
          title: 'first title post',
          article: 'first article body',
        })
        .end((err, res) => {
          expect(res.body.error.message).to.equal('jwt malformed');
          expect(res).to.have.status(401);
          done();
        });
    });

    it('deny access to articles route when invalid access token is given', (done) => {
      // invalid token ie token, notice the "invalid" word prefix
      const invalidTokens = 'invalidiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJrb3NlIiwibGFzdE5hbWUiOiJ1azQ1IiwiZW1haWwiOiJrb3NlMkBnbWFpbC5jb20iLCJpYXQiOjE1Njk1MjgxMjQsImV4cCI6MTU2OTUzMTcyNH0.Lwr64IA2_8GDtxCsMCY97Y6WzQX42vvXH3XiU4SLWH4';
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${invalidTokens}`) // json verifcation fails here during verify() at auth middleware
        .send({
          title: 'first title post',
          article: 'first article body',
        })
        .end((err, res) => {
          expect(res.body.error.message).to.equal('invalid token');
          expect(res).to.have.status(401);
          done();
        });
    });

    it('deny access to articles route when expired access token is given', (done) => {
      // invalid token but expired
      const expiredTokens = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhYjkwYmUxMC1lYTZmLTExZTktYWY1Yy1iOTNmMTM0OGEzNzgiLCJmaXJzdE5hbWUiOiJrb3NlIiwibGFzdE5hbWUiOiJ1azQ1IiwiZW1haWwiOiJ1azQ1NEBnbWFpbC5jb20iLCJpYXQiOjE1NzA2MTAwOTksImV4cCI6MTU3MDYxMzY5OX0.mUHpf5Vqm__Pye7vfNCmjlEaD9qnfbmMAocGSBYbUn8';
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${expiredTokens}`) // json verifcation fails here during verify() at auth middleware
        .send({
          title: 'first title post',
          article: 'first article body',
        })
        .end((err, res) => {
          expect(res.body.error.message).to.equal('jwt expired');
          expect(res).to.have.status(401);
          done();
        });
    });

    it('allow access to articles route, but should not post article when title is empty', (done) => {
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${tokens}`)
        .send({
          title: '',
          article: 'first article body',
        })
        .end((err, res) => {
          expect(res.body.error).to.equal('"title" is not allowed to be empty');
          expect(res).to.have.status(400);
          done();
        });
    });

    it('access to articles route allowed, should not post article when article body is empty', (done) => {
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${tokens}`)
        .send({
          title: 'first article title',
          article: '',
        })
        .end((err, res) => {
          expect(res.body.error).to.equal('"article" is not allowed to be empty');
          expect(res).to.have.status(400);
          done();
        });
    });

    it('return 400 when data is not supplied ie request with no data(empty object)', (done) => {
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${tokens}`)
        .send({
        })
        .end((err, res) => {
          expect(res.body.error).to.equal('"title" is required');
          expect(res).to.have.status(400);
          done();
        });
    });

    it('when everthing goes well, article is created 201', (done) => {
      chai
        .request(app)
        .post(url)
        .set('x-auth-token', `Bearer ${tokens}`)
        .send({
          title: 'jhfjhggj',
          article: 'article article goes here',
        })
        .end((err, res) => {
          expect(res.body.message).to.equal('Operation successful, data created');
          expect(res.body.data).to.have.property('articleid');
          expect(res.body.data).to.have.ownProperty('author');
          expect(res).to.have.status(201);
          done();
        });
    });
  });

  // // edit article
  // describe('PATCH /articleId', () => {
  //   let wrongIdURL;
  //   let url;
  //   before(() => {
  //     // do something here before patching
  //     wrongIdURL = '/api/v1/articles/<articleId>';
  //     url = `/api/v1/articles/${articleStore[0].articleId}`;
  //   });
  //   it('should not update article when title is empty', (done) => {
  //     chai
  //       .request(app)
  //       .patch(url)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         data: {
  //           title: '',
  //           article: 'update article',
  //         },
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(400);
  //         done();
  //       });
  //   });

  //   it('should not update article when article is empty', (done) => {
  //     chai
  //       .request(app)
  //       .patch(url)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         data: {
  //           title: 'updated title',
  //           article: '',
  //         },
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(400);
  //         done();
  //       });
  //   });

  //   it('return 404 when there\'s wrong id is given ', (done) => {
  //     chai
  //       .request(app)
  //       .patch(wrongIdURL)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         data: {
  //           title: 'updated title',
  //           article: 'updated article',
  //         },
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(404);
  //         done();
  //       });
  //   });

  //   it('return 400 when data is not supplied ie request with no data(empty object)', (done) => {
  //     chai
  //       .request(app)
  //       .patch(url)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(400);
  //         done();
  //       });
  //   });

  //   it('should update article when id matchs ', (done) => {
  //     chai
  //       .request(app)
  //       .patch(url)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         data: {
  //           title: 'updated title',
  //           article: 'updated article',
  //         },
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(200);
  //         done();
  //       });
  //   });
  // });

  // // delete article
  // describe('DELETE /articleId', () => {
  //   let wrongIdURL;
  //   let url;
  //   before(() => {
  //     wrongIdURL = '/api/v1/artilces/10';
  //     url = `/api/v1/articles/${articleStore[0].articleId}`;
  //   });
  //   it('404 not found, cannot delete non existing article', (done) => {
  //     chai
  //       .request(app)
  //       .delete(wrongIdURL)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .end((err, res) => {
  //         expect(res).to.have.status(404);
  //         done();
  //       });
  //   });

  //   it('401 unauthorized, cannot delete existing article not own by user', (done) => {
  //     chai
  //       .request(app)
  //       .delete(url)
  //       .set('x-auth-token', `Bearer ${notOwnerTokens}`)
  //       .end((err, res) => {
  //         expect(res).to.have.status(401);
  //         done();
  //       });
  //   });

  //   it('200 sucess, should delete existing article own by user', (done) => {
  //     chai
  //       .request(app)
  //       .delete(url)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .end((err, res) => {
  //         expect(res).to.have.status(200);
  //         done();
  //       });
  //   });
  // });

  // // comment tests
  // describe('POST /:articleId/comments', () => {
  //   // create new article as previous one was deleted
  //   before(() => {
  //     chai
  //       .request(app)
  //       .post('/api/v1/articles')
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         data: {
  //           title: 'new test title',
  //           article: 'new test article',
  //         },
  //       })
  //       .end(() => {
  //       });
  //   });
  //   // now we can conduct our test as we have new article
  //   it('404 not found, cannot add comment when article id does not exist', (done) => {
  //     chai
  //       .request(app)
  //       .post('/api/v1/articles/10/comments') // wrong id 10
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         comment: 'I am just commenting for funs here',
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(404);
  //         done();
  //       });
  //   });
  //   it('400 bad request, should not add comment when input field is empty', (done) => {
  //     chai
  //       .request(app)
  //       .post(`/api/v1/articles/${articleStore[0].articleId}/comments`)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         comment: '',
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(400);
  //         // expect(res.body.error).to.equal('\"comment\" is not allowed to be empty');
  //         done();
  //       });
  //   });

  //   it('return 400 when data is not supplied ie request with no object', (done) => {
  //     chai
  //       .request(app)
  //       .post(`/api/v1/articles/${articleStore[0].articleId}/comments`)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send()
  //       .end((err, res) => {
  //         expect(res).to.have.status(400);
  //         done();
  //       });
  //   });

  //   it('201 comments created', (done) => {
  //     chai
  //       .request(app)
  //       .post(`/api/v1/articles/${articleStore[0].articleId}/comments`)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .send({
  //         comment: 'I am just commenting for funs here',
  //       })
  //       .end((err, res) => {
  //         expect(res).to.have.status(201);
  //         done();
  //       });
  //   });
  // });

  // // view all articles
  // describe('GET /api/v1/feeds', () => {
  //   it('200 success', (done) => {
  //     chai
  //       .request(app)
  //       .get('/api/v1/feeds')
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .end((err, res) => {
  //         expect(res).to.have.status(200);
  //         done();
  //       });
  //   });
  // });

  // // view specific article
  // describe('GET /articles/:articleId', () => {
  //   it('200 success, should view article details', (done) => {
  //     chai
  //       .request(app)
  //       .get(`/api/v1/articles/${articleStore[0].articleId} `)
  //       .set('x-auth-token', `Bearer ${tokens}`)
  //       .end((erro, res) => {
  //         expect(res).to.have.status(200);
  //         done();
  //       });
  //   });
  // });
});
