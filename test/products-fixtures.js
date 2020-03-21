function makeProductsArray() {
  return [
    {
      id: 1,
      name: "Product Line 1",
    },
    {
      id: 2,
      name: "Product Line 2",
    },
    {
      id: 3,
      name: "Product three",
    } 
  ];
}
function makeMaliciousProduct() {
	const maliciousProduct = {
		id: 123,
		name: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
	};

	const expectedProduct = {
		...maliciousProduct,
		name: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
	};
	return {
		maliciousProduct,
		expectedProduct
	};
}


module.exports = {
  makeProductsArray,
  makeMaliciousProduct
};
