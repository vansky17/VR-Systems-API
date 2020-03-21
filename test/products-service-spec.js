const ProductsService = require("../src/Products/products-service");
const knex = require("knex");
const app = require("../src/app");
const fixtures = require("./products-fixtures");

describe(`Products service object`, function() {
  let db;
  before(() => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL
    });
    app.set("db", db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean products table', () =>
		db.raw('TRUNCATE documents, products RESTART IDENTITY CASCADE')
	);
  afterEach('cleanup', () =>
		db.raw('TRUNCATE documents, products RESTART IDENTITY CASCADE')
  );
  /* Test endpoint GET /api/products */
  describe(`GET /api/products`, () => {
		context(`Given no products`, () => {
			it(`responds with 200 and an empty list`, () => {
				return supertest(app)
					.get('/api/products')
					.expect(200, []);
			});
		});

		context('Given there are products in the database', () => {
			const testProducts = fixtures.makeProductsArray();

			beforeEach('insert products', () => {
				return db.into('products').insert(testProducts);
			});

			it('responds with 200 and all available products', () => {
				return supertest(app)
					.get('/api/products')
					.expect(200, testProducts);
			});
		});

		context(`Given an XSS attack product name`, () => {
			const { maliciousProduct, expectedProduct } = fixtures.makeMaliciousProduct();

			beforeEach('insert malicious product name', () => {
				return db.into('products').insert(maliciousProduct);
			});

			it('removes XSS attack ', () => {
				return supertest(app)
					.get(`/api/products`)
					.expect(200)
					.expect(res => {
						expect(res.body[0].name).to.eql(expectedProduct.name);
					});
			});
		});
  });
  
  describe(`GET /api/products/:productId`, () => {
		context(`Given no products`, () => {
			it(`responds with 404`, () => {
				const productId = 123456;
				return supertest(app)
					.get(`/api/products/${productId}`)
					.expect(404, { error: { message: `Product Line Not Found` } });
			});
		});

		context('Given there are products in the database', () => {
			const testProducts = fixtures.makeProductsArray();

			beforeEach('insert products', () => {
				return db.into('products').insert(testProducts);
			});

			it('responds with 200 and the specified product', () => {
				const productId = 2;
				const expectedProduct = testProducts[productId - 1];
				return supertest(app)
					.get(`/api/products/${productId}`)
					.expect(200, expectedProduct);
			});
		});

		context(`Given an XSS attack product`, () => {
			const testProducts =fixtures.makeProductsArray();
      const { maliciousProduct, expectedProduct } = fixtures.makeMaliciousProduct();

			beforeEach('insert malicious product', () => {
				return db
					.into('products')
					.insert(testProducts)
					.then(() => {
						return db.into('products').insert([maliciousProduct]);
					});
			});

			it('removes XSS attack content', () => {
				return supertest(app)
					.get(`/api/products/${maliciousProduct.id}`)
					.expect(200)
					.expect(res => {
						expect(res.body.name).to.eql(expectedProduct.name);
					});
			});
		});
  });

  /* Test endpoint POST /api/products */
  describe(`POST /api/products`, () => {

		it(`creates a product responding with 201 and the new product`, () => {
			const newProduct = {
				name: 'Test Product'
			};
			return supertest(app)
				.post('/api/products')
				.send(newProduct)
				.expect(201)
				.expect(res => {
					expect(res.body.name).to.eql(newProduct.name);
					expect(res.body).to.have.property('id');
					expect(res.headers.location).to.eql(`/api/products/${res.body.id}`);
				})
				.then(res =>
					supertest(app)
						.get(`/api/products/${res.body.id}`)
						.expect(res.body)
				);
		});

		const requiredFields = ['name'];

		requiredFields.forEach(field => {
			const newProduct = {
				name: 'Test Product'
			};

			it(`responds with 400 and an error message when the '${field}' is missing`, () => {
				delete newProduct[field];

				return supertest(app)
					.post('/api/products')
					.send(newProduct)
					.expect(400, {
						error: { message: `'${field}' is required` }
					});
			});
		});

		it('removes XSS attack content from response', () => {
      const { maliciousProduct, expectedProduct } = fixtures.makeMaliciousProduct();
			return supertest(app)
				.post(`/api/products`)
				.send(maliciousProduct)
				.expect(201)
				.expect(res => {
					expect(res.body.name).to.eql(expectedProduct.name);
				});
		});
  });
  
  describe(`DELETE /api/products/:productId`, () => {
		context(`Given no products`, () => {
			it(`responds with 404`, () => {
				const productId = 123456;
				return supertest(app)
					.delete(`/api/products/${productId}`)
					.expect(404, { error: { message: `Product Line Not Found` } });
			});
		});

		context('Given there are products in the database', () => {
			const testProducts = fixtures.makeProductsArray();

			beforeEach('insert product', () => {
				return db.into('products').insert(testProducts);
			});

			it('responds with 204 and removes the product', () => {
				const idToRemove = 2;
				const expectedProduct = testProducts.filter(
					product => product.id !== idToRemove
				);
				return supertest(app)
					.delete(`/api/products/${idToRemove}`)
					.expect(204)
					.then(res =>
						supertest(app)
							.get(`/api/products`)
							.expect(expectedProduct)
					);
			});
		});
	});
});