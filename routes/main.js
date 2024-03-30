
const express = require("express");
const router = express.Router();


/**
 * @desc Default home page with links to Author Home and Reader Home
 */
router.get('/', (req, res) => {
    res.render('main.ejs');
});

/**
 * @desc Display all the authors
 */
router.get("/list-authors", (req, res, next) => {
    const query = "SELECT * FROM authors";

    const createUserQuery = "INSERT INTO users (user_name) VALUES (?)";
    global.db.run(createUserQuery, [''], function (err) {
        if (err) {
            next(err);
        } else {
            const userId = this.lastID;
            global.db.all(query, function (err, authors) {
                if (err) {
                    next(err);
                } else {
                    res.render("list-authors.ejs", { authors, userId});
                }
            });
        }
    });
});

/**
 * @desc Handle form submissions to create a new author
 */
router.post('/authors/home', (req, res, next) => {
    const createAuthorQuery = "INSERT INTO authors (author_name, blog_title) VALUES (?, ?)";
    global.db.run(createAuthorQuery, ['', ''], function (err) {
        if (err) {
            next(err);
        } else {
            const authorId = this.lastID;
            res.redirect(`/authors/home/${authorId}`);
        }
    });
});

router.post('/users/home', (req, res, next) => {
    const createUserQuery = "INSERT INTO users (user_name) VALUES (?)";
    global.db.run(createUserQuery, [''], function (err) {
        if (err) {
            next(err);
        } else {
            const userId = this.lastID;
            const selectedAuthorId = req.body.authorId;
            res.redirect(`/users/home/${userId}/${selectedAuthorId}`);
        }
    });
});

module.exports = router;