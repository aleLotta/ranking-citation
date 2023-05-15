import html2canvas from "html2canvas";

let data;
let pageTitle;
const vocab = "https://rankingcitation.dei.unipd.it";
const ontology = vocab + "/ontology/";
const resource = vocab + "/resource/";

// Listener from popup to start gathering data
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "START") {
			console.log("Capturing Data");

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
			const tempUrl = document.location.href;
			const baseURL = tempUrl.split('/')[2];
			pageTitle = document.querySelector('title').innerText;
			const name = pageTitle.split('-')[1].slice(1);

			/**
			 * Data for Search Query 
			 */
			const url = new URL(window.location.href);
			const params = new URLSearchParams(url.search);
			const patentsFilter = params.get('as_sdt') ?? '0.5';
			const queryText = params.get('q');
			const language = params.get('hl') ?? 'en';
			const sinceYearFilter = params.get('as_ylo') ?? null;
			const untilYearFilter = params.get('as_yhi') ?? null;
			const sortByFilter = params.get('scisbd') ?? '0';
			const resultTypeFilter = params.get('as_rr') ?? '0';

			const filters = [];
			if (patentsFilter !== '0.5') {
				filters.push("Include patents");
			} else {
				filters.push("Don't include patents");
			}

			if ((!sinceYearFilter) && (!untilYearFilter)) {
				filters.push('Any Time');
			} else {
				if (sinceYearFilter) filters.push(`Since year ${sinceYearFilter}`);
				if (untilYearFilter) filters.push(`Until year ${untilYearFilter}`);
			}
			if (sortByFilter === '0') {
				filters.push('Sort by relevance');
			} else { filters.push('Sort by date'); }
			if (resultTypeFilter === '0') {
				filters.push('Any type');
			} else { filters.push('Review articles'); }


			/*const queryText = pageTitle.split('-')[0];
			const language = URL.split('?')[1].split('&')[0].slice(3);
			const patentsFilter = document.getElementsByClassName('gs_cb_gen gs_in_cb gs_md_li')[0] ?? null;
			const allFilters = document.querySelectorAll('.gs_ind.gs_bdy_sb_sel');
			const filters = [];
			for (let j = 0; j < allFilters.length; j++) {
				filters.push(allFilters[j].innerText);
			}
			if (patentsFilter) {
				if (patentsFilter.getAttribute("aria-checked")) {
					filters.push("Include patents");
				} else {
					filters.push("Don't include patents");
				}
			}*/


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

			const results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
			const result = results[0]
			const resultURL = result.querySelector('h3>a').href;
			const bnodeString = "_:bnode1";

			data.push({
				"@id": resource + resultListId,
				"rdf:first": { "@id": resultURL },
				"rdf:rest": { "@id": bnodeString }
			});

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


// Listener from background to take screenshot
/*chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "SCREENSHOT") {
			console.log("Taking Screenshot");
			getFullScreen(request.payload.token, request.payload.depositId);
		}
	}
);*/

function getFullScreen(ACCESS_TOKEN, depositId) {

	html2canvas(document.body).then(function (canvas) {

		canvas.toBlob(function (blob) {

			// create File variable for screenshot
			const imgFile = new File([blob], 'ranking-snapshot-page1.png', { type: 'image/png' });

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

					chrome.runtime.sendMessage({
						message: "Uploaded Screenshot",
						payload: {
							depositId: depositId,
							ACCESS_TOKEN: ACCESS_TOKEN,
						}
					})
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