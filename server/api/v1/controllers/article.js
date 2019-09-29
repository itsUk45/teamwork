import uuid from 'uuid/v1';
import { Article, articleStore } from '../models/Article';
import { Comment, commentStore} from '../models/Comments';
import {
  success, dataCreated, notFound, accessDenied, serverExceptions,
} from '../helpers/messages';
// logic for article operations

// post article
const writeArticle = async (req, res) => {
  const { title, content } = req.body.data;
  // auth user before allowing posting, its already done by the middleware
  // we dont need to auth author, as anyone logged in is allowed to write article
  const createdOn = new Date();
  const payload = req.loggedinUser; // user data from the tokens we sent when user signup/signin
  const { firstName, lastName, email } = payload; // get names and email set when signing the token
  const author = `${firstName} ${lastName}`;
  const articleId = uuid();
  const article = new Article(articleId, createdOn, author, email, title, content);
  await article.createArticle();
  const data = {
    articleId, createdOn, author, title, content,
  };
  // req.setHeader('Authorialization', 'Bearer '+'mytokens2'); // nodejs way
  // res.header('Authorialization', 'Bearer '+'mytokens2'); // expressjs way
  return dataCreated(data, res);
  // return res.status(201).json({ status: 201, message: 'article successful created', data });
};

// edit article
const editArticle = async (req, res) => {
  const { title, content } = req.body.data; // get new data to replace old ones
  //  Article existence and ownership was verified by our middleware on the router
  const fieldsToUpdate = req.articleData; // data set by our middleware
  fieldsToUpdate.title = title; // update title
  fieldsToUpdate.content = content;
  // send success message witht the updated data
  success(fieldsToUpdate, res);
};
// Block, update the editArticle above to use the same middleware as deleteArticle
// delete article
const deleteArticle = async (req, res) => {
  // verification was done by our middleware verifyArticleAndUser
  // req.index was set by our middleware,
  articleStore.splice(req.index, 1);// delete article
  // res.status(204).json({}) // 204 doesnt return any response text, so we use 200,
  res.status(200).json({ status: 200, message: 'deleted article successful' });
};

const postComment = (req, res) => {
  const { articleId } = req.params;
  const commentId = uuid();
  const createdOn = new Date();
  const authorId = req.loggedinUser.email; // get the user email from the tokens set in jwt verify
  const { comment } = req.body;
  const commentData = new Comment(articleId, commentId, createdOn, authorId, comment);
  commentData.addComment(); // comment is created here
  // response to send to requester ie article title, content , and comment
  const data = {
    createdOn,
    articleTitle: articleStore[req.ArticleIndex].title, // index set in our middlware prior to this
    article: articleStore[req.ArticleIndex].content,
    comment,

  };
  dataCreated(data, res);
};

// view all articles showing the most recent ones
const viewAllArticles = (req, res) => {
  /*
  Alogrithm:
  1. set an initial iteration of 1, we cant start from 0 coz we are offsetting by -1
  2. if initial is less than length of the array, get the last article details
  3. put the details into a new array
  4. return the new array which has sorted by latest articles
  */

  const result = [];
  for (let i = 1; i <= articleStore.length; i += 1) {
    // if (i>articleStore.length) return console.log('stop here '+i);
    const data = {
      id: articleStore[articleStore.length - i].articleId,
      createdOn: articleStore[articleStore.length - i].createdOn,
      title: articleStore[articleStore.length - i].title,
      article: articleStore[articleStore.length - i].content,
    };
    result.push(data);
  }
  //  array.slice(-negative) returns the last n(-negative) numbers, but doesnt order by latest
  // success(articleStore[articleStore.length-2].title, res);
  success(result, res);
};


// view specific article details
const viewSpecificArticle = async (req, res) => {
  const { articleId } = req.params;
  const article = new Article(articleId); // by default remaining parameters will be undefined
  const data = await article.findArticleById(); // get article whose id matches requested artilce
  const comments = new Comment(articleId);
  const dataComment = await comments.findArticleComments();
  if (dataComment.length === 0) {
    return success({
      id: data.articleId,
      createdOn: data.createdOn,
      titile: data.title,
      article: data.content,
      authorId: data.ownerEmail,
      comments: 'No comment for this article',
    }, res);
  }
  const results = {
    id: data.articleId,
    createdOn: data.createdOn,
    titile: data.title,
    article: data.content,
    authorId: data.ownerEmail,
    comments: dataComment,
  };
  success(results, res);
};

export {
  writeArticle, editArticle, deleteArticle, postComment, viewAllArticles, viewSpecificArticle,
};
