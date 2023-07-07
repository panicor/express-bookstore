process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let book_isbn;

beforeEach(async () => {
    let result = await db.query(`
      INSERT INTO
        books (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES(
          '11111111',
          'https://amazon.com/test',
          'Me',
          'English',
          50,
          'Test Pub',
          'Test Book', 
          2022)
        RETURNING isbn`);
  
    book_isbn = result.rows[0].isbn
  });


  describe("POST /books", () => {
    test("Creates new book", async () => {
        let resp = await request(app).post("/books")
        .send(
        {
            isbn: '11121111',
            amazon_url: "https://test.com",
            author: "test",
            language: "english",
            pages: 200,
            publisher: "Test Pub",
            title: "Test Title",
            year: 2011  
        }
        )
        expect(resp.statusCode).toBe(201)
        expect(resp.body.book).toHavePropert("isbn");
    })
    test("Won't create book without title", async () => {
        let resp = await request(app).post("/books")
            .send({
                author: "me"
            })
        expect(resp.statusCode).toBe(400)
    })
  })

  describe("GET /books", () => {
    test("Gets list of books (1)", async () => {
        let resp = await request(app).get("/books");
        let books = resp.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("author");
        expect(books[0]).toHaveProperty("year");
    })
  })

  describe("GET /books/:isbn", () => {
    test("Gets 1 book", async () => {
        let resp = await request(app).get(`/books/${book_isbn}`)
        expect(resp.body.books).toHaveProperty("author");
        expect(resp.body.book.isbn).toBe(book_isbn);
    })

    test("Responds with 404 if book not found", async () => {
        let resp = await request(app).get(`/books/1`)
        expect(resp.statusCode).toBe(404);
    })
  })
  
  describe("PUT /books/:id", () => {
    test("Updates book",  async () => {
        let resp = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: "https://test.com",
                author: "Me",
                language: "english",
                pages: 100,
                publisher: "Test Pub",
                title: "Updated Test",
                year: 2003
            });

        expect(resp.body.book).toHaveProperty("isbn");
        expect(resp.body.book.title).toBe("Updated Test");
    })
    test("Won't update bad book", async () => {
        let resp = await request(app).put(`/books/${book_isbn}`)
            .send({
                isbn: "11111111",
                badField: "Test",
                amazon_url: "https://test.com",
                author: "Me",
                language: "english",
                pages: 100,
                publisher: "Test Pub",
                title: "Updated Test",
                year: 2003
            })
        expect(resp.statusCode).toBe(400);
    })
    test("Responds 404 if no book found", async function () {
        await request(app)
            .delete(`/books/${book_isbn}`)
        letresp = await request(app).delete(`/books/${book_isbn}`);
        expect(resp.statusCode).toBe(404);
      });
  })


  describe("DELETE /books/:id", () => {
    test("Deletes a book", async () => {
      let resp = await request(app)
          .delete(`/books/${book_isbn}`)
      expect(resp.body).toEqual({message: "Book deleted"});
    });
  });

  afterEach(async function () {
    await db.query("DELETE FROM books");
  });
  
  
  afterAll(async function () {
    await db.end()
  });