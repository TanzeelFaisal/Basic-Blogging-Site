
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
    author_id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    blog_title TEXT
);

CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    published_date DATETIME,
    modified_date DATETIME,
    likes INTEGER,
    views INTEGER,
    status TEXT,
    author_id INTEGER,
    FOREIGN KEY (author_id) REFERENCES authors(author_id)
);

CREATE TABLE IF NOT EXISTS comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER,
    commenter_name TEXT,
    comment_text TEXT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

CREATE TABLE IF NOT EXISTS likes (
    like_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    article_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

CREATE TABLE IF NOT EXISTS views (
    view_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    article_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (article_id) REFERENCES articles(article_id)
);

CREATE TABLE IF NOT EXISTS email_accounts (
    email_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_address TEXT NOT NULL,
    user_id  INT, --the user that the email account belongs to
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Set up three users
INSERT INTO users ('user_name') VALUES ('Simon Star');
INSERT INTO users ('user_name') VALUES ('Dianne Dean');
INSERT INTO users ('user_name') VALUES ('Harry Hilbert');

INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@gmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('simon@hotmail.com', 1); 
INSERT INTO email_accounts ('email_address', 'user_id') VALUES ('dianne@yahoo.co.uk', 2); 

COMMIT;

