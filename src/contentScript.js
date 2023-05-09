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


				//if (document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a")) {
				//	document.querySelector("#gs_n > center > table > tbody > tr > td:nth-child(2) > a").click();
				//}

				// Get n of pages to capture
				const nPages = items.nPages;

				data = [];

				// define Data and Object Properties
				data.push(
					{
						"@id": vocab,
						"@type": ["owl:Ontology"]
					},

					{
						"@id": "cro:SearchResult",
						"@type": ["owl:Class"]
					},
					{
						"@id": "cro:System",
						"@type": ["owl:Class"]
					},
					{
						"@id": "cro:SearchQuery",
						"@type": ["owl:Class"]
					},
					{
						"@id": "cro:RankingSnapshot",
						"@type": ["owl:Class"]
					},
					{
						"@id": "cro:UserSettings",
						"@type": ["owl:Class"]
					},

					{
						"@id": "cro:fromSystem",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "cro:appliedTo",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "cro:produces",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "cro:hasResult",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "cro:belongsTo",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "cro:hasSettings",
						"@type": ["owl:ObjectProperty"]
					},


					{
						"@id": "cro:dateTime",
						"@type": "owl:DatatypeProperty"
					},
					/*{
						"@id": "schema:name",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:version",
						"@type": "owl:DatatypeProperty"
					},*/
					{
						"@id": "cro:queryText",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:language",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:filters",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "schema:title",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "schema:url",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:authors",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:publicationYear",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:description",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:isLogged",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:country",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:browser",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:browserVersion",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:browserLanguage",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "cro:userOS",
						"@type": "owl:DatatypeProperty"
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
						"rdfs:label": [{
							"@value": "ranking[" + dateString + "]"
						}],
						"@type": "cro:RankingSnapshot",
						"cro:dateTime": date
					},
					{
						"@id": "http://" + baseURL,
						"@type": "cro:System",
						"cro:name": name
					},
					{
						"@id": resource + queryId,
						"rdfs:label": [{
							"@value": queryText.toLowerCase().trim().replaceAll(" ", "-"),
						}],
						"@type": "cro:SearchQuery",
						"cro:queryText": queryText,
						"cro:language": language,
						"cro:filters": filters
					},
					{
						"@id": "rdf:List",
						"@type": "owl:Class"
					},
					{
						"@id": resource + resultListId,
						"rdfs:label": [{
							"@value": "resultList[" + dateString + "]",
						}],
						"@type": "rdf:List"
					},
					{
						"@id": resource + userSetId,
						"rdfs:label": [{
							"@value": "userSettings[" + dateString + "]",
						}],
						"@type": "cro:UserSettings",
						"cro:isLogged": isLogged,
						"cro:browserLanguage": browserLanguage,
						"cro:browser": browser,
						"cro:browserVersion": browserVersion,
						"cro:userOS": userOS,
					}
				);

				// add Object Properties to the model
				data.push(
					{
						"@id": resource + rankingId,
						"cro:fromSystem": [{ "@id": "http://" + baseURL }],
					},
					{
						"@id": resource + queryId,
						"cro:appliedTo": [{ "@id": "http://" + baseURL }]
					},
					{
						"@id": resource + queryId,
						"cro:produces": [{ "@id": resource + rankingId }]
					},
					{
						"@id": resource + rankingId,
						"cro:hasResult": [{ "@id": resource + resultListId }]
					},
					{
						"@id": resource + resultListId,
						"cro:belongsTo": [{ "@id": resource + rankingId }]
					},
					{
						"@id": "http://" + baseURL,
						"cro:hasSettings": [{ "@id": resource + userSetId }]
					}
				);

				let currPage = 1;
				let allPagesCaptured = false;

				let BNODE_INDEX = 1;
				let RANK_INDEX = 1;



				const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
				/**
				 * Data for Results
				 */

				results.forEach((result) => {

					if (result.innerText.startsWith('[CITATION]')) return;
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
						"rdfs:label": [{
							"@value": "rank" + RANK_INDEX,
						}],
						"@type": "cro:SearchResult",
						"schema:title": title,
						"schema:url": resultURL,
						"cro:authors": authors,
						"cro:publicationYear": publicationYear,
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
							"rdf:first": { "@id": resultURL },
							"rdf:rest": { "@id": "rdf:nil" }
						});
						return;
					}

					data.push({
						"@id": bnodeString,
						"@type": "rdf:List"
					});

					if (BNODE_INDEX === 1) {
						data.push({
							"@id": resource + resultListId,
							"rdf:first": { "@id": resultURL },
							"rdf:rest": { "@id": bnodeString }
						});
					}
					else {
						const PREV_BNODE_INDEX = BNODE_INDEX - 1;
						//const prev_node = vocab + "_bnode" + PREV_BNODE_INDEX;
						const prev_node = "_:bnode" + PREV_BNODE_INDEX;
						data.push({
							"@id": prev_node,
							"rdf:first": { "@id": resultURL },
							"rdf:rest": { "@id": bnodeString }
						});
					}
					BNODE_INDEX++;
				});

				const nextPageLink = document.getElementsByClassName("gs_ico gs_ico_nav_next")[0];

				/*let delayInMilliseconds = 1200;
			
				setTimeout(function () {
					console.log("ok");
				}, delayInMilliseconds);*/




				const outputData = {
					"@context": {
						"cro": ontology,
						"@vocab": resource,
						"schema": "https://schema.org/",
						"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
						"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
						"owl": "http://www.w3.org/2002/07/owl#"
					},
					"@graph": data
				};

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

			fetch(`https://sandbox.zenodo.org/api/deposit/depositions/${depositId}/files`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${ACCESS_TOKEN}`,
				},
				body: formData,
			})
				.then((response) => response.json())
				.then((data) => {
					console.log("File uploaded successfully:", data);

					// post the deposit on Zenodo
					fetch(`https://sandbox.zenodo.org/api/deposit/depositions/${depositId}/actions/publish`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${ACCESS_TOKEN}`,
						},
					})
						.then((response) => response.json())
						.then((data) => {
							console.log("Deposit published successfully:", data);

							// send to popup for citation
							chrome.runtime.sendMessage({
								message: "DEPOSIT DATA",
								payload: {
									depositDOI: data.doi,
									creators: data.metadata.creators,
									title: data.metadata.title,
									publication_date: data.metadata.publication_date,
									publisher: "Zenodo"
								}
							})
						})
						.catch((error) => {
							console.error("Error publishing deposit:", error);
						});
				})
				.catch((error) => {
					console.error("Error uploading file:", error);
				});
		});

	})

}

function hashCode(s) {
	let h = 0, l = s.length, i = 0;
	if (l > 0)
		while (i < l)
			h = (h << 5) - h + s.charCodeAt(i++) | 0;
	return h;
};