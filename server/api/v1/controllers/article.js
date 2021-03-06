import uuid from 'uuid/v1';
import { Article, articleStore } from '../models/Article';
import { Comment } from '../models/Comments';
import {
  success, dataCreated, somethingWrongErr,
} from '../helpers/messages';

// post article
const writeArticle = async (req, res) => {
  try {
    const { title, content } = req.body.data;
    const createdOn = new Date();
    const payload = req.loggedinUser; // token data set at signup/signin
    const { firstName, lastName, email } = payload; // data set when signing the token
    const author = `${firstName} ${lastName}`;
    const articleId = uuid();
    const article = new Article(articleId, createdOn, author, email, title, content);
    await article.createArticle();
    const data = {
      articleId, createdOn, author, title, content,
    };
    return dataCreated(data, res);
  } catch (err) {
    somethingWrongErr(res);
  }
};

// edit article
const editArticle = async (req, res) => {
  try {
    const { title, content } = req.body.data;
    const fieldsToUpdate = req.articleData; // data set by our middleware
    fieldsToUpdate.title = title; // update title
    fieldsToUpdate.content = content;
    success(fieldsToUpdate, res);
  } catch (err) {
    somethingWrongErr(res);
  }
};

// delete article
const deleteArticle = async (req, res) => {
  articleStore.splice(req.index, 1);// delete article
  res.status(200).json({ status: 200, message: 'deleted article successful' });
};

// post comments
const postComment = (req, res) => {
  const { articleId } = req.params;
  const commentId = uuid();
  const createdOn = new Date();
  const authorId = req.loggedinUser.email;
  const { comment } = req.body;
  const commentData = new Comment(articleId, commentId, createdOn, authorId, comment);
  commentData.addComment();
  const data = {
    createdOn,
    articleTitle: articleStore[req.ArticleIndex].title, // index was set by our middleware
    article: articleStore[req.ArticleIndex].content,
    comment,
  };
  dataCreated(data, res);
};

// view all articles showing the most recent ones
const viewAllArticles = (req, res) => {
  const result = [];
  for (let i = 1; i <= articleStore.length; i += 1) {
    const data = {
      id: articleStore[articleStore.length - i].articleId,
      createdOn: articleStore[articleStore.length - i].createdOn,
      title: articleStore[articleStore.length - i].title,
      article: articleStore[articleStore.length - i].content,
    };
    result.push(data);
  }
  success(result, res);
};


// view specific article details
const viewSpecificArticle = async (req, res) => {
  const { articleId } = req.params;
  const data = await Article.findArticleById(articleId);
  const dataComment = await Comment.findArticleComments(articleId);
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
