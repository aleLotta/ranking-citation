import html2canvas from "html2canvas";

let data;
let pageTitle;
const vocab = "https://citationranking.dei.unipd.it";
const ontology = vocab + "/ontology/";
const resource = vocab + "/resource/";

// Listener from popup to start gathering data
chrome.storage.sync.get(['nPages'], function (items) {
	chrome.runtime.onMessage.addListener(
		function (request, sender, sendResponse) {
			if (request.message === "START") {
				console.log("Capturing Data");
				//const someData = getData();


				if (document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a")) {
					document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a").click();
				}

				// Get n of pages to capture

				const nPages = items.nPages;

				data = [];

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
						"@id": ontology + "hasSettings",
						"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
					},


					{
						"@id": ontology + "dateTime",
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
						"@id": ontology + "isLogged",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
					{
						"@id": ontology + "country",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
					{
						"@id": ontology + "browser",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
					{
						"@id": ontology + "browserVersion",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
					{
						"@id": ontology + "browserLanguage",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
					{
						"@id": ontology + "userOS",
						"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
					},
				);

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

				// Data for User Settings
				const loginElement = document.getElementById("gs_hdr_act_i");
				let isLogged = false;
				if (loginElement) isLogged = true;
				const userData = navigator.userAgentData;
				const userOS = userData.platform;
				const browser = userData.brands[1].brand;
				const browserVersion = userData.brands[1].version;
				const browserLanguage = navigator.language;

				let rankingId = "ranking[" + timestamp + "]"
				rankingId = hashCode(rankingId);
				let queryId = queryText.toLowerCase().trim().replaceAll(" ", "-") + "[" + timestamp + "]";
				queryId = hashCode(queryId);
				let resultListId = "resultList[" + timestamp + "]";
				resultListId = hashCode(resultListId);
				let userSetId = "userSettings[" + timestamp + "]";
				userSetId = hashCode(userSetId);

				// Add individuals to the model
				data.push(
					{
						"@id": resource + rankingId,
						"http://www.w3.org/2000/01/rdf-schema#label": [{
							"@value": "ranking[" + dateString + "]"
						}],
						"@type": ontology + "RankingSnapshot",
						[ontology + "dateTime"]: date
					},
					{
						"@id": "http://" + baseURL,
						"@type": ontology + "System",
						[ontology + "name"]: name
					},
					{
						"@id": resource + queryId,
						"http://www.w3.org/2000/01/rdf-schema#label": [{
							"@value": queryText.toLowerCase().trim().replaceAll(" ", "-"),
						}],
						"@type": ontology + "SearchQuery",
						[ontology + "queryText"]: queryText,
						[ontology + "language"]: language,
						[ontology + "filters"]: filters
					},
					{
						"@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List",
						"@type": "http://www.w3.org/2002/07/owl#Class"
					},
					{
						"@id": resource + resultListId,
						"http://www.w3.org/2000/01/rdf-schema#label": [{
							"@value": "resultList[" + dateString + "]",
						}],
						"@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
					},
					{
						"@id": resource + userSetId,
						"http://www.w3.org/2000/01/rdf-schema#label": [{
							"@value": "userSettings[" + dateString + "]",
						}],
						"@type": ontology + "UserSettings",
						[ontology + "isLogged"]: isLogged,
						[ontology + "browserLanguage"]: browserLanguage,
						[ontology + "browser"]: browser,
						[ontology + "browserVersion"]: browserVersion,
						[ontology + "userOS"]: userOS,
					}
				);

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
					},
					{
						"@id": resource + "http://" + baseURL,
						[ontology + "hasSettings"]: [{ "@id": resource + userSetId }]
					}
				);

				let currPage = 1;
				let allPagesCaptured = false;

				let BNODE_INDEX = 1;
				let RANK_INDEX = 1;

				while (true) {

					const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
					/**
					 * Data for Results
					 */

					results.forEach((result) => {

						const title = result.querySelector('h3>a').innerText;
						const resultURL = result.querySelector('h3>a').href;
						const context_el = result.querySelector('div.gs_a').innerText;
						const splitContext = context_el.split('-');
						const tempString = splitContext[splitContext.length - 2];
						const publicationYear = parseInt(tempString.slice(tempString.length - 5, tempString.length - 1));

						//const linked_authors = result.querySelectorAll('.gs_a>a');
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
							"@type": ontology + "SearchResult",
							"https://schema.org/title": title,
							"https://schema.org/url": resultURL,
							[ontology + "authors"]: authors,
							[ontology + "publicationYear"]: publicationYear,
						});

						RANK_INDEX++;

						//const bnodeString = vocab + "_bnode" + BNODE_INDEX;
						const bnodeString = "_:bnode" + BNODE_INDEX;

						if (BNODE_INDEX === (results.length * nPages)) {
							const PREV_BNODE_INDEX = BNODE_INDEX - 1;
							//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
							const prev_node = "_:bnode" + PREV_BNODE_INDEX;
							data.push({
								"@id": prev_node,
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" }
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
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": bnodeString }
							});
						}
						else {
							const PREV_BNODE_INDEX = BNODE_INDEX - 1;
							//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
							const prev_node = "_:bnode" + PREV_BNODE_INDEX;
							data.push({
								"@id": prev_node,
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
								"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": bnodeString }
							});
						}
						BNODE_INDEX++;
					});

					if (currPage === 1) {
						console.log("Done Capturing");
						break;
					}
					else document.getElementsByClassName("gs_ico gs_ico_nav_next")[0].click();
					currPage++;

					let delayInMilliseconds = 1200;

					setTimeout(function () {
						console.log("ok");
					}, delayInMilliseconds);

				}

				const outputData = [{
					"@context": {
						"CRO": vocab,
					},
					"@graph": [data]
				}];

				const someData = JSON.stringify(outputData);
				sendResponse({ data: someData, title: pageTitle });

			}
		}
	);
});

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

/*function getData() {

	if (document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a")) {
		document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a").click();
	}

	// Get n of pages to capture
	chrome.storage.sync.get(['nPages'], function (items) {
		const nPages = items.nPages;

		data = [];

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
				"@id": ontology + "hasSettings",
				"@type": ["http://www.w3.org/2002/07/owl#ObjectProperty"]
			},


			{
				"@id": ontology + "dateTime",
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
				"@id": ontology + "isLogged",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
			{
				"@id": ontology + "country",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
			{
				"@id": ontology + "browser",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
			{
				"@id": ontology + "browserVersion",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
			{
				"@id": ontology + "browserLanguage",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
			{
				"@id": ontology + "userOS",
				"@type": "http://www.w3.org/2002/07/owl#DatatypeProperty"
			},
		);

		
		// Data for Ranking Snapshot
		 
		const date = new Date();
		const dateString = date.toString().split("(")[0].trim();
		const timestamp = Date.now();

		// Data for System
		
		const URL = document.location.href;
		const baseURL = URL.split('/')[2];
		pageTitle = document.querySelector('title').innerText;
		const name = pageTitle.split('-')[1].slice(1);

		
		// Data for Search Query 
		
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

		// Data for User Settings
		const loginElement = document.getElementById("gs_hdr_act_i");
		let isLogged = false;
		if (loginElement) isLogged = true;
		const userData = navigator.userAgentData;
		const userOS = userData.platform;
		const browser = userData.brands[1].brand;
		const browserVersion = userData.brands[1].version;
		const browserLanguage = navigator.language;

		let rankingId = "ranking[" + timestamp + "]"
		rankingId = hashCode(rankingId);
		let queryId = queryText.toLowerCase().trim().replaceAll(" ", "-") + "[" + timestamp + "]";
		queryId = hashCode(queryId);
		let resultListId = "resultList[" + timestamp + "]";
		resultListId = hashCode(resultListId);
		let userSetId = "userSettings[" + timestamp + "]";
		userSetId = hashCode(userSetId);

		// Add individuals to the model
		data.push(
			{
				"@id": resource + rankingId,
				"http://www.w3.org/2000/01/rdf-schema#label": [{
					"@value": "ranking[" + dateString + "]"
				}],
				"@type": ontology + "RankingSnapshot",
				[ontology + "dateTime"]: date
			},
			{
				"@id": "http://" + baseURL,
				"@type": ontology + "System",
				[ontology + "name"]: name
			},
			{
				"@id": resource + queryId,
				"http://www.w3.org/2000/01/rdf-schema#label": [{
					"@value": queryText.toLowerCase().trim().replaceAll(" ", "-"),
				}],
				"@type": ontology + "SearchQuery",
				[ontology + "queryText"]: queryText,
				[ontology + "language"]: language,
				[ontology + "filters"]: filters
			},
			{
				"@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List",
				"@type": "http://www.w3.org/2002/07/owl#Class"
			},
			{
				"@id": resource + resultListId,
				"http://www.w3.org/2000/01/rdf-schema#label": [{
					"@value": "resultList[" + dateString + "]",
				}],
				"@type": "http://www.w3.org/1999/02/22-rdf-syntax-ns#List"
			},
			{
				"@id": resource + userSetId,
				"http://www.w3.org/2000/01/rdf-schema#label": [{
					"@value": "userSettings[" + dateString + "]",
				}],
				"@type": ontology + "UserSettings",
				[ontology + "isLogged"]: isLogged,
				[ontology + "browserLanguage"]: browserLanguage,
				[ontology + "browser"]: browser,
				[ontology + "browserVersion"]: browserVersion,
				[ontology + "userOS"]: userOS,
			}
		);

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
			},
			{
				"@id": resource + "http://" + baseURL,
				[ontology + "hasSettings"]: [{ "@id": resource + userSetId }]
			}
		);

		let currPage = 1;
		let allPagesCaptured = false;

		let BNODE_INDEX = 1;
		let RANK_INDEX = 1;

		while (true) {

			const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
			
			// Data for Results
			 
			results.forEach((result) => {

				const title = result.querySelector('h3>a').innerText;
				const resultURL = result.querySelector('h3>a').href;
				const context_el = result.querySelector('div.gs_a').innerText;
				const splitContext = context_el.split('-');
				const tempString = splitContext[splitContext.length - 2];
				const publicationYear = parseInt(tempString.slice(tempString.length - 5, tempString.length - 1));

				//const linked_authors = result.querySelectorAll('.gs_a>a');
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
					"@type": ontology + "SearchResult",
					"https://schema.org/title": title,
					"https://schema.org/url": resultURL,
					[ontology + "authors"]: authors,
					[ontology + "publicationYear"]: publicationYear,
				});

				RANK_INDEX++;

				//const bnodeString = vocab + "_bnode" + BNODE_INDEX;
				const bnodeString = "_:bnode" + BNODE_INDEX;

				if (BNODE_INDEX === (results.length * nPages)) {
					const PREV_BNODE_INDEX = BNODE_INDEX - 1;
					//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
					const prev_node = "_:bnode" + PREV_BNODE_INDEX;
					data.push({
						"@id": prev_node,
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": "http://www.w3.org/1999/02/22-rdf-syntax-ns#nil" }
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
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": bnodeString }
					});
				}
				else {
					const PREV_BNODE_INDEX = BNODE_INDEX - 1;
					//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
					const prev_node = "_:bnode" + PREV_BNODE_INDEX;
					data.push({
						"@id": prev_node,
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#first": { "@id": resultURL },
						"http://www.w3.org/1999/02/22-rdf-syntax-ns#rest": { "@id": bnodeString }
					});
				}
				BNODE_INDEX++;
			});

			if (currPage === nPages) {
				console.log("Done Capturing");
				break;
			}
			else document.getElementsByClassName("gs_ico gs_ico_nav_next")[0].click();
			currPage++;
		}

		const outputData = [{
			"@context": {
				"CRO": vocab,
			},
			"@graph": [data]
		}];

		return JSON.stringify(outputData);

	});

}
*/

function hashCode(s) {
	let h = 0, l = s.length, i = 0;
	if (l > 0)
		while (i < l)
			h = (h << 5) - h + s.charCodeAt(i++) | 0;
	return h;
};