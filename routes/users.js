/**
 * users.js
 * These are example routes for user management
 * This shows how to correctly structure your routes for the project
 * and the suggested pattern for retrieving data by executing queries
 *
 * NB. it's better NOT to use arrow functions for callbacks with the SQLite library
* 
 */
const express = require("express");
const router = express.Router();

/**
 * @desc Display all the users
 */
router.get("/list-users", (req, res, next) => {
    // Define the query
    query = "SELECT * FROM users"

    // Execute the query and render the page with the results
    global.db.all(query, 
        function (err, rows) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                res.json(rows); // render page as simple json
            }
        }
    );
});

/**
 * @desc Displays a page with a form for creating a user record
 */
router.get("/add-user", (req, res) => {
    res.render("add-user.ejs");
});

/**
 * @desc Displays a page with a form for deleting a user record
 */
router.get("/delete-user", (req, res, next) => {
    const query = "SELECT * FROM users";
    
    global.db.all(query, [], function (err, users) {
        if (err) {
            next(err);
        } else {
            res.render('delete-user.ejs', { users });
        }
    });
});

/**
 * @desc Add a new user to the database based on data from the submitted form
 */
router.post("/add-user", (req, res, next) => {
    // Define the query
    query = "INSERT INTO users (user_name) VALUES( ? );"
    query_parameters = [req.body.user_name]
    
    // Execute the query and send a confirmation message
    global.db.run(query, query_parameters,
        function (err) {
            if (err) {
                next(err); //send the error on to the error handler
            } else {
                res.send(`New data inserted @ id ${this.lastID}!`);
                next();
            }
        }
    );
});

/**
 * @desc Delete User
 */
router.post("/delete-user/:userId", (req, res, next) => {
    const userId = req.params.userId;
    const deleteUserQuery = "DELETE FROM users WHERE user_id = ?";

    global.db.run(deleteUserQuery, [userId], function (err) {
        if (err) {
            next(err);
        } else {
            res.redirect("/users/delete-user");
        }
    });
});

/**
 * @desc Display the Reader's Home Page
 */
router.get("/home/:userId/:authorId", (req, res, next) => {
    const userId = req.params.userId;
    const authorId = req.params.authorId;
    const blogInfoQuery = "SELECT blog_title, author_name FROM authors WHERE author_id = ?";
    const articlesQuery = "SELECT * FROM articles WHERE status = 'published' AND author_id = ? ORDER BY published_date DESC";

    global.db.get(blogInfoQuery, [authorId], function (err, blogInfo) {
        if (err) {
            next(err);
        } else {
            global.db.all(articlesQuery, [authorId], function (err, publishedArticles) {
                if (err) {
                    next(err);
                } else {
                    const data = {
                        blogTitle: blogInfo.blog_title,
                        authorName: blogInfo.author_name,
                        publishedArticles,
                        userId: userId,
                        authorId: authorId,
                    };

                    res.render('reader-home.ejs', data);
                }
            });
        }
    });
});

/**
 * @desc Display the Reader - Article Page
 */
router.get("/article/:userId/:authorId/:articleId", (req, res, next) => {
    const userId = req.params.userId;
    const authorId = req.params.authorId;
    const articleId = req.params.articleId;

    const articleQuery = "SELECT * FROM articles WHERE article_id = ?";
    const commentsQuery = "SELECT * FROM comments WHERE article_id = ? ORDER BY created_date DESC";
    const updateViewsQuery = "UPDATE articles SET views = views + 1 WHERE article_id = ?";
    const checkViewQuery = "SELECT COUNT(*) as count FROM views WHERE article_id = ? AND user_id = ?";
    const recordViewQuery = "INSERT INTO views (article_id, user_id) VALUES (?, ?)";

    global.db.get(articleQuery, [articleId], function (err, article) {
        if (err) {
            next(err);
        } else {
            global.db.all(commentsQuery, [articleId], function (err, comments) {
                if (err) {
                    next(err);
                } else {
                    global.db.get(checkViewQuery, [articleId, userId], (err, result) => {
                        if (err) {
                            next(err);
                        } else {
                            const alreadyViewed = result.count > 0;

                            if (!alreadyViewed) {
                                // Update the views and record the user's view
                                global.db.run(updateViewsQuery, [articleId], function (err) {
                                    if (err) {
                                        next(err);
                                    } else {
                                        global.db.run(recordViewQuery, [articleId, userId], function (err) {
                                            if (err) {
                                                next(err);
                                            } else {
                                                const data = {
                                                    userId,
                                                    authorId,
                                                    article,
                                                    comments,
                                                };
                                                res.render('reader-article.ejs', data);
                                            }
                                        });
                                    }
                                });
                            } else {
                                // User has already viewed the article, render the page without updating views
                                const data = {
                                    userId,
                                    authorId,
                                    article,
                                    comments,
                                };
                                res.render('reader-article.ejs', data);
                            }
                        }
                    });
                }
            });
        }
    });
});

/**
 * @desc Add a comment to an article
 */
router.post("/add-comment/:userId/:authorId/:articleId", (req, res, next) => {
    const userId = req.params.userId;
    const authorId = req.params.authorId;
    const articleId = req.params.articleId;
    const commenterName = req.body.commenterName;
    const commentText = req.body.commentText;

    const addCommentQuery = "INSERT INTO comments (article_id, user_id, commenter_name, comment_text, created_date) VALUES (?, ?, ?, ?, datetime('now'))";

    global.db.run(addCommentQuery, [articleId, userId, commenterName, commentText], function (err) {
        if (err) {
            next(err);
        } else {
            // Redirect back to the article page
            res.redirect(`/users/article/${userId}/${authorId}/${articleId}`);
        }
    });
});

/**
 * @desc Like an article
 */
router.post("/like-article/:userId/:authorId/:articleId", (req, res, next) => {
    const userId = req.params.userId;
    const authorId = req.params.authorId;
    const articleId = req.params.articleId;

    // Check if the user has already liked the article
    const checkLikeQuery = "SELECT COUNT(*) as count FROM likes WHERE article_id = ? AND user_id = ?";
    
    global.db.get(checkLikeQuery, [articleId, userId], (err, result) => {
        if (err) {
            next(err);
        } else {
            const alreadyLiked = result.count > 0;

            if (!alreadyLiked) {
                // Update the likes and record the user's like
                const updateLikesQuery = "UPDATE articles SET likes = likes + 1 WHERE article_id = ?";
                const recordLikeQuery = "INSERT INTO likes (article_id, user_id) VALUES (?, ?)";
                console.log()

                global.db.serialize(() => {
                    global.db.run(updateLikesQuery, [articleId]);
                    global.db.run(recordLikeQuery, [articleId, userId]);

                    // Redirect back to the article page
                    res.redirect(`/users/article/${userId}/${authorId}/${articleId}`);
                });
            } else {
                // User has already liked the article, redirect back to the article page
                res.redirect(`/users/article/${userId}/${authorId}/${articleId}`);
            }
        }
    });
});

// Export the router object so index.js can access it
module.exports = router;
