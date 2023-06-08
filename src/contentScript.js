
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
				let name = pageTitle.split('-')[1].slice(1);
				if (name.includes('Google')) {
					if (!name.includes('Scholar')) {
						name = 'Google Search';
					}
				} else {
					if (pageTitle.includes('Scopus')) name = 'Scopus';
					else {
						name = 'Bing';
					}
				}

				/**
				 * Data for Search Query 
				 */
				const url = new URL(window.location.href);
				const params = new URLSearchParams(url.search);
				const queryText = params.get('q') ?? params.get('st1');
				let language = params.get('hl') ?? navigator.language.split('-')[0];
				if (name === 'Scopus') language = 'en';

				const filters = [];
				if (name.includes('Google')) {
					if (name.includes('Scholar')) {
						const patentsFilter = params.get('as_sdt') ?? '0.5';
						const sinceYearFilter = params.get('as_ylo') ?? null;
						const untilYearFilter = params.get('as_yhi') ?? null;
						const sortByFilter = params.get('scisbd') ?? '0';
						const resultTypeFilter = params.get('as_rr') ?? '0';

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
					} else {
						// FILTERS FOR GOOGLE SEARCH
						const fromFilter = params.get('tbs') ?? '';
						switch (fromFilter) {
							case '':
								filters.push('Any Time');
								break;
							case 'qdr:h':
								filters.push('Past Hour');
								break;
							case 'qdr:d':
								filters.push('Past 24 hours');
								break;
							case 'qdr:w':
								filters.push('Past Week');
								break;
							case 'qdr:m':
								filters.push('Past Month');
								break;
							case 'qdr:y':
								filters.push('Past Year');
								break;
							default:
								const sinceFilter = fromFilter.split(',')[1].replace('cd_min:', '');
								const untilFilter = fromFilter.split(',')[1].replace('cd_max:', '');
								if (sinceFilter != '') filters.push('Since ' + sinceFilter);
								if (untilFilter != '') filters.push('Until ' + untilFilter);

						}

					}
				} else {
					if (name === 'Scopus') {
						// FILTERS FOR SCOPUS COULD STILL BE EXPANDED

						const refinefilter = params.get('cluster') ?? '';

						if (refinefilter.includes('all')) {
							if (refinefilter.includes('"all",f')) {
								filters.push('Exclude All Open Access');
							}
							else filters.push('Exclude All Open Access');
						}
						if (refinefilter.includes('publisherfullgold')) {
							if (refinefilter.includes('"publisherfullgold",f')) {
								filters.push('Exclude Gold');
							}
							else filters.push('Gold');
						}
						if (refinefilter.includes('publisherhybridgold')) {
							if (refinefilter.includes('"publisherhybridgold",f')) {
								filters.push('Exclude Hybrid Gold');
							} else filters.push('Hybrid Gold');

						}
						if (refinefilter.includes('publisherfree2read')) {
							if (refinefilter.includes('"publisherfree2read",f')) {
								filters.push('Exclude Bronze');
							} else filters.push('Bronze');

						}
						if (refinefilter.includes('repository')) {
							if (refinefilter.includes('"repository",f')) {
								filters.push('Exclude Green');
							} else filters.push('Green');
						}

						if (refinefilter.includes('scopubyr')) {
							const splitArr = refinefilter.split(',');
							let yearIndex = splitArr.indexOf('scopubyr');
							if (yearIndex === -1) {
								let temp = refinefilter.replaceAll('t+', '');
								temp = temp.replaceAll('f+', '');
								tempArr = temp.split(',');
								yearIndex = tempArr.indexOf('scopubyr');
							}
							yearIndex++;
							if (refinefilter.includes(`${splitArr[yearIndex]},f`)) {
								filters.push(`Exclude Publication Year ${splitArr[yearIndex]}`)
							} else filters.push(`Publication Year ${splitArr[yearIndex]}`)
						}

					} else {
						// FILTERS FOR BING
						const fromFilter = params.get('filters') ?? '';
						if (fromFilter === '') filters.push('Any Time');
						if (fromFilter.includes('ez1')) filters.push('Past 24 hours');
						if (fromFilter.includes('ez2')) filters.push('Past Week');
						if (fromFilter.includes('ez3')) filters.push('Past Month');
						if (fromFilter.includes('ez5')) {
							let interval = document.getElementsByClassName('fs_label')[0].innerText;
							interval = interval.replaceAll(' ', '').split('-');
							filters.push('Since ' + interval[0]);
							filters.push('Until ' + interval[1]);
						}

					}
				}



				// Data for Settings
				let isLogged = false;
				if (name.includes('Google')) {
					const loginElement = name.includes('Scholar') ? document.getElementById("gs_hdr_act_i") :
						document.getElementsByClassName('gb_k gbii')[0];
					if (loginElement) isLogged = true;
				} else {
					if (name === 'Bing') {
						if (!(document.getElementsByClassName('id_avatar sw_spd')[0].style === 'display:none')) {
							isLogged = true;
						}
					} else {
						const loginElement = document.getElementById('initials');
						if (loginElement) isLogged = true;
					}
				}

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
						"rco:nPages": parseInt(nPages, 10)
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

				let results, result, resultURL;
				if (name.includes('Google')) {
					if (name.includes('Scholar')) {
						results = document.querySelectorAll('.gs_r.gs_or.gs_scl');
						result = results[0];
						resultURL = result.querySelector('h3>a').href;
					} else {
						let results = document.querySelectorAll('.MjjYud:not(:has(div.cUnQKe, .Ww4FFb.vt6azd.obcontainer, .oIk2Cb, .EyBRub,' +
							'.uVMCKf, .g.dFd2Tb.PhX2wd))')
						if (results.length == 0) results = document.querySelectorAll('.TzHB6b.cLjAic.K7khPe')
						result = results[0];
						resultURL = result.querySelector('.yuRUbf>a').href;
					}
				} else {
					if (name === 'Scopus') {
						results = document.querySelectorAll('.searchArea');
						result = results[0];
						resultURL = result.querySelector('.ddmDocTitle').href;
					} else {
						results = document.querySelectorAll('.b_algo');
						result = results[0];
						resultURL = result.querySelector('h2 > a').href;
					}
				}

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
				if (name.includes('Google')) sendResponse({ data: someData, title: pageTitle });
				else {
					sendResponse({ data: someData, title: `${queryText}-${name}` });
				}
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