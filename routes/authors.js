// authors.js

const express = require("express");
const router = express.Router();

/**
 * @desc Displays a page with a form for creating an author record
 */
router.get("/add-author", (req, res) => {
    res.render("add-author.ejs");
});

/**
 * @desc Displays a page with a form for deleting an author record
 */
router.get("/delete-author", (req, res, next) => {
    const query = "SELECT * FROM authors";
    
    global.db.all(query, [], function (err, authors) {
        if (err) {
            next(err);
        } else {
            res.render('delete-author.ejs', { authors });
        }
    });
});

/**
 * @desc Add a new author to the database based on data from the submitted form
 */
router.post("/add-author", (req, res, next) => {
    // Define the query
    authorName = req.body.author_name;
    const query = "INSERT INTO authors (author_name, blog_title) VALUES (?, ?);";
    const queryParameters = [req.body.author_name, req.body.blog_title];

    // Validate that the author name is not empty
    if (!authorName) {
        return res.status(400).send("Author name is required.");
    }

    // Execute the query and send a confirmation message
    global.db.run(query, queryParameters,
        function (err) {
            if (err) {
                next(err); // send the error on to the error handler
            } else {
                res.redirect(`/authors/home/${this.lastID}`);
            }
        }
    );
});

/**
 * @desc Delete Author
 */
router.post("/delete-author/:authorId", (req, res, next) => {
    const authorId = req.params.authorId;
    const deleteAuthorQuery = "DELETE FROM authors WHERE author_id = ?";

    global.db.run(deleteAuthorQuery, [authorId], function (err) {
        if (err) {
            next(err);
        } else {
            res.redirect("/authors/delete-author");
        }
    });
});

/**
 * @desc Display the Author's Home Page
 */
router.get("/home/:authorId", (req, res, next) => {
    const authorId = req.params.authorId;

    const authorQuery = "SELECT * FROM authors WHERE author_id = ?";
    const publishedArticlesQuery = "SELECT * FROM articles WHERE author_id = ? AND status = 'published'";
    const draftArticlesQuery = "SELECT * FROM articles WHERE author_id = ? AND status = 'draft'";
    const createReaderQuery = "INSERT INTO users (user_name) VALUES (?)";

    global.db.get(authorQuery, [authorId], function (err, authorData) {
        if (err) {
            next(err);
        } else {
            global.db.all(publishedArticlesQuery, [authorId], function (err, publishedArticles) {
                if (err) {
                    next(err);
                } else {
                    global.db.all(draftArticlesQuery, [authorId], function (err, draftArticles) {
                        if (err) {
                            next(err);
                        } else {
                            global.db.run(createReaderQuery, [''], function (err) {
                                if (err) {
                                    next(err);
                                } else {
                                    const userId = this.lastID;
                                    const data = {
                                        blogTitle: authorData.blog_title,
                                        authorName: authorData.author_name,
                                        articles: [],
                                        authorId,
                                        publishedArticles,
                                        draftArticles,
                                        readerId: userId,
                                    };
                                    res.render('author-home.ejs', data);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

/**
 * @desc Display the Author's Settings Page
 */
router.get("/settings/:authorId", (req, res, next) => {
    const authorId = req.params.authorId;

    const query = "SELECT * FROM authors WHERE author_id = ?";
    
    global.db.get(query, [authorId], function (err, authorData) {
        if (err) {
            next(err);
        } else {
            const data = {
                authorId,
                blogTitle: authorData.blog_title,
                authorName: authorData.author_name,
            };

            res.render('author-settings.ejs', data);
        }
    });
});

/**
 * @desc Update author settings with new values and redirect to Author Home Page
 */
router.post("/update-settings/:authorId", (req, res, next) => {
    const authorId = req.params.authorId;

    // Validate form data
    const { blog_title, author_name } = req.body;
    if (!blog_title || !author_name) {
        // Handle validation error (you can customize this part based on your needs)
        res.send("Blog title and author name are required.");
        return;
    }

    // Logic for updating author settings in the database
    const updateQuery = "UPDATE authors SET blog_title = ?, author_name = ? WHERE author_id = ?";
    const updateParams = [blog_title, author_name, authorId];

    global.db.run(updateQuery, updateParams, function (err) {
        if (err) {
            next(err); // send the error on to the error handler
        } else {
            // Redirect to the Author's Home Page after updating settings
            res.redirect(`/authors/home/${authorId}`);
        }
    });
});

/**
 * @desc Display the Edit Article Page
 */
router.get("/edit-draft/:draftId", (req, res, next) => {
    const draftId = req.params.draftId;

    const query = "SELECT * FROM articles WHERE article_id = ?";
    
    global.db.get(query, [draftId], function (err, article) {
        if (err) {
            next(err);
        } else {
            console.log("Article:", article); // Add this line for debugging

            const data = {
                draftId,
                authorId: article ? article.author_id : null,
                article,
            };

            res.render('author-edit-article.ejs', data);
        }
    });
});

/**
 * @desc Create a new draft article and redirect to its edit page
 */
router.post("/create-draft", (req, res, next) => {
    const authorId = req.body.authorId;
    console.log(authorId)
    const createDraftQuery = "INSERT INTO articles (author_id, title, content, status, created_date, modified_date, views, likes) VALUES (?, ?, ?, 'draft', datetime('now'), datetime('now'), 0, 0)";

    global.db.run(createDraftQuery, [authorId, '', ''], function (err) {
        if (err) {
            next(err);
        } else {
            const draftId = this.lastID;
            res.redirect(`/authors/edit-draft/${draftId}`);
        }
    });
});

/**
 * @desc Update the draft article with new data
 */
router.post("/update-draft/:draftId", (req, res, next) => {
    const draftId = req.params.draftId;
    const title = req.body.title;
    const content = req.body.content;

    const updateDraftQuery = "UPDATE articles SET title = ?, content = ?, modified_date = datetime('now') WHERE article_id = ?";

    global.db.run(updateDraftQuery, [title, content, draftId], function (err) {
        if (err) {
            next(err);
        } else {
            // Redirect to the edit page again or any other page as needed
            res.redirect(`/authors/home/${req.body.authorId}`);
        }
    });
});

/**
 * @desc Delete a draft article
 */
router.post("/delete-draft/:articleId", (req, res, next) => {
    const articleId = req.params.articleId;
    const deleteDraftQuery = "DELETE FROM articles WHERE article_id = ? AND status = 'draft'";

    global.db.run(deleteDraftQuery, [articleId], function (err) {
        if (err) {
            next(err);
        } else {
            res.redirect(`/authors/home/${req.body.authorId}`);
        }
    });
});

/**
 * @desc Publish a draft article
 */
router.post("/publish-draft/:articleId", (req, res, next) => {
    const articleId = req.params.articleId;
    const publishDraftQuery = "UPDATE articles SET status = 'published', published_date = datetime('now') WHERE article_id = ? AND status = 'draft'";

    global.db.run(publishDraftQuery, [articleId], function (err) {
        if (err) {
            next(err);
        } else {
            res.redirect(`/authors/home/${req.body.authorId}`);
        }
    });
});

/**
 * @desc Delete a draft article
 */
router.post("/delete-article/:articleId", (req, res, next) => {
    const articleId = req.params.articleId;
    const deleteDraftQuery = "DELETE FROM articles WHERE article_id = ? AND status = 'published'";

    global.db.run(deleteDraftQuery, [articleId], function (err) {
        if (err) {
            next(err);
        } else {
            res.redirect(`/authors/home/${req.body.authorId}`);
        }
    });
});

module.exports = router;