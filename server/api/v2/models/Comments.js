import pool from './dbConfig';
import Article from './Article';

// create comment table
const commentSchema = `CREATE TABLE IF NOT EXISTS
commentStore(
  articleId VARCHAR(100) REFERENCES articleStore(articleId) ON DELETE CASCADE ON UPDATE CASCADE,
  commentId VARCHAR(100) PRIMARY KEY NOT NULL,
  createdOn timestamptz NOT NULL,
  authorId VARCHAR(100) NOT NULL,
  comment VARCHAR(500) NOT NULL
  )`;
pool.query(commentSchema, (error, results) => {
  if (error) return console.log(`comment errors ${error}`); // something wrong happened
  // everything ok, table created
});

class Comment extends Article {
  constructor(articleId, commentId, createdOn, authorId, comment) {
    super(articleId);
    this.commentId = commentId;
    this.createdOn = createdOn;
    this.authorId = authorId;
    this.comment = comment;
  }

  // create new comment
  addComment() {
    const query = `INSERT INTO commentStore(articleId, commentId, createdOn, authorId, comment )
     VALUES($1, $2, $3, $4, $5) RETURNING createdOn, articleId, authorId, comment `;
    const values = [this.articleId, this.commentId, this.createdOn, this.authorId, this.comment];
    return pool.query(query, values);
  }

  // find all comments of an article
  static findArticleComments(articleIdFromUser) {
    return pool.query('SELECT commentId, authorId, comment   FROM commentStore WHERE articleId=$1', [articleIdFromUser]);
  }
}

export default Comment;
