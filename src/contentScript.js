import html2canvas from "html2canvas";

let data;
let pageTitle;
const vocab = "https://rankingcitation.dei.unipd.it";
const ontology = vocab + "/ontology/";
const resource = vocab + "/resource/";

chrome.storage.sync.get(['nPages', 'firstName', 'lastName', 'orcid'], function (items) {
	const nPages = items.nPages;
	const firstName = items.firstName;
	const lastName = items.lastName;
	const orcid = items.orcid;

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
						"@id": "rco:SearchResult",
						"@type": ["owl:Class"]
					},
					{
						"@id": "rco:System",
						"@type": ["owl:Class"]
					},
					{
						"@id": "rco:SearchQuery",
						"@type": ["owl:Class"]
					},
					{
						"@id": "rco:RankingSnapshot",
						"@type": ["owl:Class"]
					},
					{
						"@id": "rco:Settings",
						"@type": ["owl:Class"]
					},
					{
						"@id": "rco:User",
						"@type": ["owl:Class"]
					},
					{
						"@id": "foaf:Person",
						"@type": ["owl:Class"]
					},

					{
						"@id": "rco:fromSystem",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:executedBy",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:produces",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:hasResult",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:belongsTo",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:hasSettings",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rco:performs",
						"@type": ["owl:ObjectProperty"]
					},
					{
						"@id": "rdfs:subClassOf",
						"@type": ["owl:ObjectProperty"]
					},

					{
						"@id": "rco:dateTime",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:queryText",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:language",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:filters",
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
						"@id": "schema:name",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:authors",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:publicationYear",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:description",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:isLogged",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:country",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:browser",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:browserVersion",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:browserLanguage",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:userOS",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:currentPage",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:nPages",
						"@type": "owl:DatatypeProperty"
					},
					{
						"@id": "rco:userName",
						"@type": "owl:DatatypeProperty"
					},

					{
						"@id": "foaf:Person",
						"@rdfs:subClassOf": [{
							"@id": "rco:User",
						}]
					}

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

				// Data for Settings
				const loginElement = document.getElementById("gs_hdr_act_i");
				let isLogged = false;
				if (loginElement) isLogged = true;
				const userData = navigator.userAgentData;
				const userOS = userData.platform;
				const browser = userData.brands[1].brand;
				const browserVersion = userData.brands[1].version;
				const browserLanguage = navigator.language;

				// Data for User
				const userName = firstName + ' ' + lastName;


				let rankingId = "ranking-" + timestamp + "-" + userName
				rankingId = hashCode(rankingId);
				let queryId = queryText.toLowerCase().trim().replaceAll(" ", "-");
				queryId = hashCode(queryId);
				let resultListId = "resultList-" + timestamp + "-" + userName;
				resultListId = hashCode(resultListId);
				let settingsId = "settings-" + timestamp + "-" + userName;
				settingsId = hashCode(settingsId);
				let userId = orcid;

				// Add individuals to the model
				data.push(
					{
						"@id": resource + rankingId,
						"rdfs:label": [{
							"@value": "ranking[" + dateString + "]"
						}],
						"@type": "rco:RankingSnapshot",
						"rco:dateTime": date,
						"rco:nPages": parseInt(nPages,10)
					},
					{
						"@id": "http://" + baseURL,
						"@type": "rco:System",
						"schema:name": name
					},
					{
						"@id": resource + queryId,
						"rdfs:label": [{
							"@value": queryText.toLowerCase().trim().replaceAll(" ", "-"),
						}],
						"@type": "rco:SearchQuery",
						"rco:queryText": queryText,
						"rco:language": language,
						"rco:filters": filters
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
						"@id": resource + settingsId,
						"rdfs:label": [{
							"@value": "settings[" + dateString + "]",
						}],
						"@type": "rco:Settings",
						"rco:isLogged": isLogged,
						"rco:browserLanguage": browserLanguage,
						"rco:browser": browser,
						"rco:browserVersion": browserVersion,
						"rco:userOS": userOS,
					},
					{
						"@id": userId,
						"rdfs:label": [{
							"@value": "user",
						}],
						"@type": "rco:User",
						"rco:userName": userName,
					},
				);

				// add Object Properties to the model
				data.push(
					{
						"@id": resource + rankingId,
						"rco:fromSystem": [{ "@id": "http://" + baseURL }],
					},
					{
						"@id": resource + queryId,
						"rco:executedBy": [{ "@id": "http://" + baseURL }]
					},
					{
						"@id": resource + queryId,
						"rco:produces": [{ "@id": resource + rankingId }]
					},
					{
						"@id": resource + rankingId,
						"rco:hasResult": [{ "@id": resource + resultListId }]
					},
					{
						"@id": resource + resultListId,
						"rco:belongsTo": [{ "@id": resource + rankingId }]
					},
					{
						//"@id": "http://" + baseURL,
						"@id": resource + queryId,
						"rco:hasSettings": [{ "@id": resource + settingsId }]
					},
					{
						"@id": userId,
						"rco:performs": [{ "@id": resource + queryId }]
					},
					{
						"@id": userId,
						"rco:hasSettings": [{ "@id": resource + settingsId }]
					},

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
						"rco": ontology,
						"@vocab": resource,
						"schema": "https://schema.org/",
						"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
						"rdfs": "http://www.w3.org/2000/01/rdf-schema#",
						"owl": "http://www.w3.org/2002/07/owl#",
						"foaf": "http://xmlns.com/foaf/0.1/#"
					},
					"@graph": data
				};

				const someData = JSON.stringify(outputData);
				sendResponse({ data: someData, title: pageTitle });

			}
		}
	);
});

function hashCode(s) {
	let h = 0, l = s.length, i = 0;
	if (l > 0)
		while (i < l)
			h = (h << 5) - h + s.charCodeAt(i++) | 0;
	return h;
};