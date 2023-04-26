import html2canvas from "html2canvas";

let data;
let pageTitle;
const vocab = "https://citationranking.dei.unipd.it";
const ontology = vocab + "/ontology/";
const resource = vocab + "/resource/";

// Listener from popup to start gathering data
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "START") {
			console.log("Capturing Data");
			const someData = getData();

			sendResponse({ data: someData, title: pageTitle });
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

	})

}

function getData() {

	data = [];

	/**
	 * Data for Ranking Snapshot
	 */
	const date = new Date();	
	const dateString = date.toString().split("(")[0].trim();
	const timestamp = Date.now();

	/**
	 * Data for System
	 */
	const URL = document.location.href;
	const baseURL = URL.split('/')[2];
	pageTitle = document.querySelector('title').innerText;
	const name = pageTitle.split('-')[1].slice(1);
	// check if it usefull the version of the search engine and where to find it
	// const version;

	/**
	 * Data for Search Query 
	 */
	const queryText = pageTitle.split('-')[0];
	const language = URL.split('?')[1].split('&')[0].slice(3);
	const patentsFilter = document.getElementsByClassName('gs_cb_gen gs_in_cb gs_md_li')[0];
	const allFilters = document.querySelectorAll('.gs_ind.gs_bdy_sb_sel');
	const filters = [];
	for (let j = 0; j < allFilters.length; j++) {
		filters.push(allFilters[j].innerText);
	}
	if (patentsFilter.getAttribute("aria-checked")) {
		filters.push("Include patents");
	} else { filters.push("Don't include patents"); }

	// define Data and Object Properties
	data.push(
		{
			"@id": vocab,
			"@type": ["http://www.w3.org/2002/07/owl#Ontology"]
		},
		{
			"@id": ontology + "fromSystem",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": ontology + "appliedTo",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": ontology + "produces",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": ontology + "hasResult",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},
		{
			"@id": ontology + "belongsTo",
			"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
		},


		{
			"@id": ontology + "date",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": "https://schema.org/name",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "version",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "queryText",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "language",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "filters",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": "https://schema.org/title",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": "https://schema.org/url",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "authors",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "publicationYear",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "description",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
		{
			"@id": ontology + "n_citations",
			"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
		},
	);

	let rankingId = "ranking[" + timestamp + "]"
	rankingId = hashCode(rankingId);
	let queryId = queryText.toLowerCase().trim().replaceAll(" ", "-") + "[" + timestamp + "]";
	queryId = hashCode(queryId);
	let resultListId = "resultList[" + timestamp + "]";
	resultListId = hashCode(resultListId);

	// Add individuals to the model
	data.push({
		"@id": resource + rankingId,
		"http://www.w3.org/2000/01/rdf-schema#label": [{
			"@value": "ranking[" + dateString + "]"
		}],
		"@type": ontology + "RankingSnapshot",
		[ontology + "date"]: date
	}, {
		"@id": "http://" + baseURL,
		"@type": ontology + "System",
		[ontology + "name"]: name
	}, {
		"@id": resource + queryId,
		"http://www.w3.org/2000/01/rdf-schema#label": [{
			"@value": queryText.toLowerCase().trim().replaceAll(" ", "-"),
		}],
		"@type": ontology + "SearchQuery",
		[ontology + "queryText"]: queryText,
		[ontology + "language"]: language,
		[ontology + "filters"]: filters
	}, {
		"@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List",
		"@type": "http://www.w3.org/2002/07/owl#Class"
	}, {
		"@id": resource + resultListId,
		"http://www.w3.org/2000/01/rdf-schema#label": [{
			"@value": "resultList[" + dateString + "]",
		}],
		"@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
	});

	// add Object Properties to the model
	data.push(
		{
			"@id": resource + rankingId,
			[ontology + "fromSystem"]: [{ "@id": "http://" + baseURL }],
		},
		{
			"@id": resource + queryId,
			[ontology + "appliedTo"]: [{ "@id": "http://" + baseURL }]
		},
		{
			"@id": resource + queryId,
			[ontology + "produces"]: [{ "@id": resource + rankingId }]
		},
		{
			"@id": resource + rankingId,
			[ontology + "hasResult"]: [{ "@id": resource + resultListId }]
		},
		{
			"@id": resource + resultListId,
			[ontology + "belongsTo"]: [{ "@id": resource + rankingId }]
		}
	);

	const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
	/**
	 * Data for Rankings
	 */

	let BNODE_INDEX = 1;
	let RANK_INDEX = 1;

	results.forEach((result) => {

		const title = result.querySelector('h3>a').innerText;
		const resultURL = result.querySelector('h3>a').href;
		const context_el = result.querySelector('div.gs_a').innerText;
		const splitContext = context_el.split('-');
		const tempString = splitContext[splitContext.length - 2];
		const publicationYear = parseInt(tempString.slice(tempString.length - 5, tempString.length - 1));

		const linked_authors = result.querySelectorAll('.gs_a>a');
		const authors = splitContext[0].split(',').map((element) => {
			element = element.trim();
			element = element.replaceAll('…', '');
			return element.replaceAll('&nbsp', '')
		});

		data.push({
			//"@id": vocab + "result" + RESULT_INDEX,
			"@id": resultURL,
			"http://www.w3.org/2000/01/rdf-schema#label": [{
				"@value": "rank" + RANK_INDEX,
			}],
			"@type": ontology + "Result",
			"https://schema.org/title": title,
			"https://schema.org/url": resultURL,
			[ontology + "authors"]: authors,
			[ontology + "publicationYear"]: publicationYear,
		});

		RANK_INDEX++;

		//const bnodeString = vocab + "_bnode" + BNODE_INDEX;
		const bnodeString = "_bnode" + BNODE_INDEX;

		if (BNODE_INDEX === results.length) {
			const PREV_BNODE_INDEX = BNODE_INDEX - 1;
			//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
			const prev_node = "_bnode" + PREV_BNODE_INDEX;
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
				"@id": resource + resultListId,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": resultURL,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": bnodeString
			});
		}
		else {
			const PREV_BNODE_INDEX = BNODE_INDEX - 1;
			//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
			const prev_node = "_bnode" + PREV_BNODE_INDEX;
			data.push({
				"@id": prev_node,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": resultURL,
				"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": bnodeString
			});
		}
		BNODE_INDEX++;
	});

	const outputData = [{
		"@context": {
			"CRO": vocab,
		},
		"@graph": [data]
	}];

	return JSON.stringify(outputData);
}

function hashCode(s) {
	var h = 0, l = s.length, i = 0;
	if ( l > 0 )
	  while (i < l)
		h = (h << 5) - h + s.charCodeAt(i++) | 0;
	return h;
  };