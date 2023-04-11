import html2canvas from "html2canvas";

let data;
const vocab = "http://example.com#";

// Listener from popup to start gathering data
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "START") {
			console.log("Capturing Data");
			const someData = getData();

			//sendResponse({ data: someData, image: pageScreenshot });
			sendResponse({ data: someData });
		}
	}
);

// Listener from background to take screenshot
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "SCREENSHOT") {
			console.log("Taking Screenshot");
			getFullScreen(request.payload.token, request.payload.depositId);
		}
	}
);

function getFullScreen(ACCESS_TOKEN, depositId) {

	html2canvas(document.body).then(function (canvas) {

		//var blobData = canvasToBlob(canvas);
		canvas.toBlob(function (blob) {

			// create File variable for screenshot
			const imgFile = new File([blob], 'ranking-snapshot.png', { type: 'image/png' });

			const formData = new FormData();

			// Upload the screenshot file to the the deposit
			formData.append("file", imgFile);

			fetch(`https://zenodo.org/api/deposit/depositions/${depositId}/files`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: formData,
			})
				.then((response) => response.json())
				.then((data) => {
					console.log("File uploaded successfully:", data);
				})
				.catch((error) => {
					console.error("Error uploading file:", error);
				});
		});

		// chrome.runtime.sendMessage({ image: blobData });

	})

}

function getData() {

	data = [];

	/**
	 * Data for Ranking Snapshot
	 */
	const timestamp = new Date();

	/**
	 * Data for System
	 */
	const URL = document.location.href;
	const baseURL = URL.split('/')[2];
	const pageTitle = document.querySelector('title').innerText;
	const name = pageTitle.split('-')[1].slice(1);
	// check if it usefull the version of the search engine and where to find it
	// const version;

	/**
	 * Data for Search Query 
	 */
	const queryText = pageTitle.split('-')[0];
	const language = URL.split('?')[1].split('&')[0].slice(3);
	const allFilters = document.querySelectorAll('.gs_ind.gs_bdy_sb_sel');
	const filters = [];
	for (let j = 0; j < allFilters.length; j++) {
		filters.push(allFilters[j].innerText);
	}

	// define Data and Object Properties
	data.push(
		{
			"@id": vocab + "fromSystem",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": vocab + "appliedTo",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": vocab + "produces",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": vocab + "hasResult",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": vocab + "belongsTo",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},


		{
			"@id": vocab + "timestamp",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": "https://schema.org/name",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "version",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "queryText",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "language",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "filters",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": "https://schema.org/title",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "authors",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "publicationYear",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "description",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": vocab + "n_citations",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
	);

	// Add individuals to the model
	data.push({
		"@id": vocab + "ranking",
		"@type": vocab + "RankingSnapshot",
		"http://example.com#timestamp": timestamp
	}, {
		"@id": "http://" + baseURL,
		"@type": vocab + "System",
		"https://schema.org/name": name,
		"http://example.com#version": "?"
	}, {
		"@id": vocab + "query",
		"@type": vocab + "SearchQuery",
		"http://example.com#queryText": queryText,
		"http://example.com#language": language,
		"http://example.com#filters": filters
	}, {
		"@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List",
		"@type": "http://www.w3.org/2002/07/owl#Class"
	}, {
		"@id": vocab + "resultList",
		"@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
	});

	// add Object Properties to the model
	data.push(
		{
			"@id": vocab + "ranking",
			"http://example.com#fromSystem": [{ "@id": "http://" + baseURL }],
		},
		{
			"@id": vocab + "query",
			"http://example.com#appliedTo": [{ "@id": "http://" + baseURL }]
		},
		{
			"@id": vocab + "query",
			"http://example.com#produces": [{ "@id": vocab + "ranking" }]
		},
		{
			"@id": vocab + "ranking",
			"http://example.com#hasResult": [{ "@id": vocab + "resultList" }]
		},
		{
			"@id": vocab + "resultList",
			"http://example.com#belongsTo": [{ "@id": vocab + "ranking" }]
		}
	);

	const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
	/**
	 * Data for Result
	 */

	let BNODE_INDEX = 1;
	let RESULT_INDEX = 1;

	results.forEach((result) => {

		const title = result.querySelector('h3>a').innerText;
		const resultURL = result.querySelector('h3>a').href;
		const context_el = result.querySelector('div.gs_a').innerText;
		const splitContext = context_el.split('-');
		const tempString = splitContext[splitContext.length - 2];
		const publicationYear = parseInt(tempString.slice(tempString.length - 5, tempString.length - 1));

		// get the authors, but only the ones that have a link
		// check if it is possible to have also the others 
		const linked_authors = result.querySelectorAll('.gs_a>a');
		const authors = splitContext[0].split(',').map((element) => {
			element = element.trim();
			element = element.replace('…', '');
			return element.replace('&nbsp', '')
		});

		// see if it can be usefull to have the number of citations
		// const n_citations;


		data.push({
			//"@id": vocab + "result" + RESULT_INDEX,
			"@id": resultURL + "#result" + RESULT_INDEX,
			"@type": vocab + "Result",
			"https://schema.org/title": title,
			"https://schema.org/url": resultURL,
			"http://example.com#authors": authors,
			"http://example.com#publicationYear": publicationYear,
			"http://example.com#description": "?",
			"http://example.com#n_citations": 0,
		});

		RESULT_INDEX++;

		const bnodeString = vocab + "_bnode" + BNODE_INDEX;

		if (BNODE_INDEX === results.length) {
			const PREV_BNODE_INDEX = BNODE_INDEX - 1;
			const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
			data.push({
				"@id": prev_node,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": resultURL,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil"
			});
			return;
		}

		data.push({
			"@id": bnodeString,
			"@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
		});

		if (BNODE_INDEX === 1) {
			data.push({
				"@id": vocab + "resultList",
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": resultURL,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": bnodeString
			});
		}
		else {
			const PREV_BNODE_INDEX = BNODE_INDEX - 1;
			const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
			data.push({
				"@id": prev_node,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": resultURL,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": bnodeString
			});
		}
		BNODE_INDEX++;
	});

	//fs.writeFile('../data.jsonld', JSON.stringify(data, null, 2), (err) => {
	//    if (err) throw err;
	//    console.log('The file has been saved!');
	//});

	return JSON.stringify(data);
	//return "Data has been collected";
}