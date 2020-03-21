const DocumentsService = require("../src/Documents/documents-service");
const knex = require("knex");
const app = require("../src/app");
const fixturesDocs = require("./docs-fixtures");
const fixturesProducts = require("./products-fixtures");

describe(`Docs service object`, function() {
  let db;
  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after(() => db.destroy());
  
  beforeEach('clean the documents table', () =>
		db.raw('TRUNCATE documents, products RESTART IDENTITY CASCADE')
  );
  afterEach('cleanup', () =>
    db.raw('TRUNCATE documents, products RESTART IDENTITY CASCADE')
  );
  
  /* Test endpoint GET /api/docs */
  describe(`GET /api/docs`, () => {
		context(`Given no docs`, () => {
			it(`responds with 200 and an empty list`, () => {
				return supertest(app)
					.get('/api/docs')
					.expect(200, []);
			});
		});

		context('Given there are docs in the database', () => {
			const testProducts = fixturesProducts.makeProductsArray();
			const testDocs = fixturesDocs.makeDocsArray();

			beforeEach('insert doc', () => {
				return db
					.into('products')
					.insert(testProducts)
					.then(() => {
						return db.into('documents').insert(testDocs);
					});
			});

			it('responds with 200 and all of the docs', () => {
				return supertest(app)
					.get('/api/docs')
					.expect(res => {
						expect(res.body[0].name).to.eql(testDocs[0].name);
						expect(res.body[0]).to.have.property('id');
					});
			});
		});
    context(`Given an XSS attack doc`, () => {
			const testProducts = fixturesProducts.makeProductsArray();
			const { maliciousDoc, expectedDoc } = fixturesDocs.makeMaliciousDoc();
			
			beforeEach('insert malicious doc', () => {
				return db
					.into('products')
					.insert(testProducts)
					.then(() => {
						return db.into('documents').insert([maliciousDoc]);
					});
			});

			it('removes XSS attack from document', () => {
				return supertest(app)
					.get(`/api/docs`)
					.expect(200)
					.expect(res => {
            expect(res.body[0].name).to.eql(expectedDoc.name);
            expect(res.body[0].vernum).to.eql(expectedDoc.vernum);
            expect(res.body[0].partnum).to.eql(expectedDoc.partnum);
            expect(res.body[0].formattype).to.eql(expectedDoc.formattype);
            expect(res.body[0].author).to.eql(expectedDoc.author);
            expect(res.body[0].productid).to.eql(expectedDoc.productid);
            expect(res.body[0].descr).to.eql(expectedDoc.descr);
            expect(res.body[0].path).to.eql(expectedDoc.path); 
					});
			});
		});
  });
  /* Tests POST api/docs */
  describe(`POST /api/docs`, () => {
		const testProducts = fixturesProducts.makeProductsArray();
		const testDocs = fixturesDocs.makeDocsArray();
		beforeEach('post a doc', () => {
      return db  
			.insert(testProducts)
			.into('products')
		});

		it(`creates a doc, responding with 201 and the new doc`, () => {
			const newDoc = {
        name: 'Test Doc',
        productid: 1,
				vernum: 1,
				partnum: '1234',
        formattype: 'PDF',
        reldate: new Date(),
        author: 'John Doe',
        descr: 'New document description.',
        path: 'google.com'       
      };
			return supertest(app)
				.post('/api/docs')
				.send(newDoc)
				.expect(201)
				.expect(res => {
					expect(res.body.name).to.eql(newDoc.name);
					expect(res.body.productid).to.eql(newDoc.productid);
					expect(res.body.partnum).to.eql(newDoc.partnum);
					expect(res.body.vernum).to.eql(newDoc.vernum);
					expect(res.body.formattype).to.eql(newDoc.formattype);
					expect(res.body.author).to.eql(newDoc.author);
					expect(res.body.descr).to.eql(newDoc.descr);
					expect(res.body.path).to.eql(newDoc.path);
					expect(res.body).to.have.property('id');
				})
				.then(res =>
					supertest(app)
						.get(`/api/docs/${res.body.id}`)
						.expect(res.body)
				);
		});

		it('removes XSS attack content from response', () => {
			const { maliciousDoc, expectedDoc } = fixturesDocs.makeMaliciousDoc();
			
			return supertest(app)
				.post(`/api/docs`)
				.send(maliciousDoc)
				.expect(201)
				.expect(res => {
					expect(res.body.name).to.eql(expectedDoc.name);
					expect(res.body.descr).to.eql(expectedDoc.descr);
				});
		});
	}); 

});


