// Go to options page when installed
chrome.runtime.onInstalled.addListener(() => {
	chrome.runtime.openOptionsPage();
});

let data;
let queryText, searchSystem;
// Check if popup as said to start RO creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.cmd === 'CREATE RO') {
		chrome.storage.sync.get('nPages', function (items) {
			if (Object.keys(items).length !== 0) {
				const nPages = items.nPages;
				data = JSON.parse(request.payload.message);
				queryText = request.payload.title.split("_")[0].trim().toUpperCase();
				searchSystem = request.payload.title.split("_")[1].trim();
				if (searchSystem.includes('Google') && !(searchSystem.includes('Scholar')))
					searchSystem = 'Google Search';
				getPagesRanks(nPages);
			}
		});
	}
});

let newData = new Array();
let newDataCounter = 0;
// Add the data from the additional pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === 'NEW DATA') {
		const dataToAdd = request.payload.newData;
		for (let d in dataToAdd) {
			data['@graph'].push(dataToAdd[d]);
		}
		newDataCounter++;
		if (newDataCounter == request.payload.nPages) {
			uploadData(data);
		}

	}
});

async function getPagesRanks(nPages) {
	try {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

			const url = new URL(tabs[0].url);
			/*const params = new URLSearchParams(url.search);

			let patentsFilter, languageFilter, sinceYearFilter,
				untilYearFilter, sortByFilter, resultTypeFilter;
			let queryFilter;

			if (url.origin.includes('google')) {
				if (url.origin.includes('scholar')) {
					patentsFilter = params.get('as_sdt') ?? '0.5';
					languageFilter = params.get('hl') ?? navigator.language.split('-')[0];
					sinceYearFilter = params.get('as_ylo') ?? '';
					untilYearFilter = params.get('as_yhi') ?? '';
					sortByFilter = params.get('scisbd') ?? '0';
					resultTypeFilter = params.get('as_rr') ?? '0';
				} else {
					languageFilter = params.get('hl') ?? '';
				}
				queryFilter = params.get('q');
			} else {
				queryFilter = params.get('st1');
			}

			chrome.storage.sync.set({
				bNodeIndex: 1,
			})*/

			if (url.origin === "https://twitter.com") {

				let scriptName = 'Twitter/getTwitterRanks.js';
				chrome.scripting.executeScript({
					target: {
						tabId: tabs[0].id
					},
					files: [scriptName]
				});

			} else {
				for (let i = 0; i < nPages; i++) {

					let pageURL, startURL, scriptName;
					switch (url.origin) {
						case "https://scholar.google.com":
							startURL = 10 * i;
							scriptName = 'Scholar/getScholarRanks.js';
							//pageURL = `https://scholar.google.com/scholar?start=${startURL}&q=${queryFilter}&hl=${languageFilter}&as_sdt=${patentsFilter}&as_vis=1&` +
							//	`as_ylo=${sinceYearFilter}&as_yhi${untilYearFilter}&scisbd=${sortByFilter}&as_rr=${resultTypeFilter}`;
							pageURL = url;
							pageURL.searchParams.set('start', String(startURL))
							break;

						case "https://www.google.com":
							startURL = 10 * i;
							scriptName = 'Google/getGoogleRanks.js';
							//pageURL = `${url}&start=${startURL}`;
							pageURL = url;
							pageURL.searchParams.set('start', String(startURL))
							break;

						case "https://www.scopus.com":
							startURL = (20 * i) + 1;
							scriptName = 'Scopus/getScopusRanks.js';
							pageURL = url;
							pageURL.searchParams.set('offset', String(startURL));
							pageURL.searchParams.set('origin', 'resultlist');
							break;

						case "https://www.bing.com":
							startURL = (10 * i) + 1;
							scriptName = 'Bing/getBingRanks.js'
							pageURL = url;
							pageURL.searchParams.set('first', String(startURL));
							break;

					}

					chrome.tabs.create({ url: String(pageURL), active: false }, createdTab => {
						chrome.tabs.onUpdated.addListener(function _(tabId, info, tab) {
							if (tabId === createdTab.id && info.url) {
								chrome.tabs.onUpdated.removeListener(_);

								chrome.scripting.executeScript({
									target: {
										tabId: tabId
									},
									files: [scriptName]
								});
							}
						});
					});

				}
			}

		});

	}
	catch (error) {
		console.error('Encountered problems while opening the other pages');
	}
}

function uploadData(data) {

	console.log('Start updating data');

	chrome.storage.sync.get(['accessToken', 'firstName', 'lastName', 'affiliation', 'orcid', 'keywords', 'otherAuthors', 'nPages', 'uploadDestination'], function (items) {
		const ACCESS_TOKEN = items.accessToken;
		const ZENODO_USER = items.firstName + " " + items.lastName;
		const AFFILIATION = items.affiliation;
		const ORCID = items.orcid;
		const NEW_KEYWORDS = items.keywords;

		const otherAuthors = items.otherAuthors ? items.otherAuthors.split(";") : '';

		const nPages = items.nPages;

		const uploadDestination = items.uploadDestination;

		const currentTimeStamp = new Date();

		const user_id = ORCID;
		const user = {
			"@id": user_id,
			"@type": "Person",
			"name": ZENODO_USER,
			"affiliation": AFFILIATION,
		};

		const RC = {
			"@context": "https://w3id.org/ro/crate/1.1/context",
			"@graph": [
				{
					"@id": "./",
					"@type": "Dataset",
					"datePublished": currentTimeStamp,
					"hasPart": [
						{
							"@id": "output-data.jsonld"
						}
					],
					"author": {
						"@id": user_id
					}
				},
				{
					"@id": "ro-crate-metadata.json",
					"@type": "CreativeWork",
					"about": {
						"@id": "./"
					},
					"conformsTo": {
						"@id": "https://w3id.org/ro/crate/1.1"
					}
				},
				{
					"@id": "output-data.json",
					"@type": "File",
					"author": {
						"@id": user_id
					},
					"encodingFormat": "application/json",
					"name": "result data"
				},
				user
			]
		}

		for (let page = 1; page <= nPages; page++) {
			RC['@graph'].push({
				"@id": `ranking-snapshot-page${page}.png`,
				"@type": "File",
				"author": {
					"@id": user_id
				},
				"encodingFormat": "image/png",
				"name": "screenshot"
			},)
		}

		// Send response to popup script
		//sendResponse({
		//	response: "RO created",
		//	payload: {
		//		content: RC
		//	}
		//});

		// create File variable for gathered data
		const dataBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/ld+json' });
		const dataFile = new File([dataBlob], 'output-data.jsonld', { type: 'application/ld+json' });

		// create File variable for ro-crate data
		const crateBlob = new Blob([JSON.stringify(RC, null, 2)], { type: 'application/json' });
		const crateFile = new File([crateBlob], 'ro-crate-metadata.json', { type: 'application/json' });


		// Upload to Zenodo

		const tempDate = new Date;
		const pub_date = tempDate.toISOString().split('T')[0];
		const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
		const pub_datetime = tempDate.toLocaleString('en-US', options);

		const TITLE = "Ranking snapshot for the query \"" + queryText + "\" performed on " + searchSystem;
		const NOTES = `The citation snapshot presented here is generated using the Unipd Ranking Citation Tool, 
				a tool developed by Gianmaria Silvello and Alessandro Lotta (University of Padua). 
				This tool, accessible at https://rankingcitation.dei.unipd.it`;
		const DESCRIPTION = `This deposit provides a snapshot of results obtained through a ${searchSystem} search query
				on the topic of "${queryText}". The search was performed by ${ZENODO_USER}, from ${AFFILIATION}, on ${pub_datetime}. 
				The captured data includes ${nPages} pages of search results, which have been saved in the output-data.jsonld file.
				In addition to the citation data, the deposit includes PNG format screenshots of the search results, 
				allowing visual reference to the captured information. 
				The metadata for the Research Object Crate is also included in JSON format, providing essential details about the contents.
				${NOTES}`;

		let keywords = ["Unipd Ranking Citation Tool", queryText, searchSystem, "Ranking Snapshot"];
		for (let el of NEW_KEYWORDS) {
			keywords.push(el);
		}

		let depositAuthors = [{
			name: ZENODO_USER,
			affiliation: AFFILIATION,
			orcid: ORCID
		}];

		// Push other authors
		for (let author of otherAuthors) {
			if (author != '') {
				depositAuthors.push(
					{
						name: author.split(',')[0],
						affiliation: author.split(',')[2],
						orcid: author.split(',')[1]
					}
				);
			}
		}

		const depositMetadata = {
			metadata: {
				title: TITLE,
				upload_type: "dataset",
				publication_date: pub_date,
				description: DESCRIPTION,
				language: 'eng',
				notes: NOTES,
				keywords: keywords,
				creators: depositAuthors,
			},
		};

		fetch(`${uploadDestination}api/deposit/depositions`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${ACCESS_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(depositMetadata),
		})
			.then((response) => response.json())
			.then((data) => {
				console.log(data)

				if (String(data.status).startsWith('4') || String(data.status).startsWith('5')) {
					chrome.runtime.sendMessage({
						message: 'ERROR',
						status: data.status
					})

					console.error(data);
				}
				else {
					console.log('Deposit created succesfully', data);

					// Get the deposit ID from the response
					const depositId = data.id;

					// Upload the data file to the new deposit
					const formData = new FormData();
					formData.append("file", dataFile);

					fetch(`${uploadDestination}api/deposit/depositions/${depositId}/files`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${ACCESS_TOKEN}`,
						},
						body: formData,
					})
						.then((response) => response.json())
						.then((data) => {
							if (String(data.status).startsWith('4') || String(data.status).startsWith('5')) {
								chrome.runtime.sendMessage({
									message: 'ERROR',
									status: data.status
								})

								console.error(data);
							} else {
								console.log("File uploaded successfully:", data);
							}
						})
						.catch((error) => {
							console.error("Error uploading file:", error);
						});

					// Upload the crate file 
					const formData2 = new FormData();
					formData2.append("file", crateFile);

					fetch(`${uploadDestination}api/deposit/depositions/${depositId}/files`, {
						method: "POST",
						headers: {
							Authorization: `Bearer ${ACCESS_TOKEN}`,
						},
						body: formData2,
					})
						.then((response) => response.json())
						.then((data) => {
							if (String(data.status).startsWith('4') || String(data.status).startsWith('5')) {
								chrome.runtime.sendMessage({
									message: 'ERROR',
									status: data.status
								})

								console.error(data);
							} else {
								console.log("File uploaded successfully:", data);
							}
						})
						.catch((error) => {
							console.error("Error uploading file:", error);
						});
					// Capture screenshot for the additional pages
					console.log(searchSystem);
					if (searchSystem === 'Twitter') {
						chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
							chrome.tabs.sendMessage(tabs[0].id, {
								message: `ADD SCREENSHOT1`,
								payload: {
									token: ACCESS_TOKEN,
									depositId: depositId,
									uploadDestination: uploadDestination,
								}
							});
						});
					} else {
						for (let page = nPages; page > 0; page--) {
							chrome.tabs.query({ currentWindow: true }, function (tabs) {
								chrome.tabs.sendMessage(tabs[tabs.length - page].id, {
									message: `ADD SCREENSHOT${nPages - page + 1}`,
									payload: {
										token: ACCESS_TOKEN,
										depositId: depositId,
										uploadDestination: uploadDestination,
									}
								});
							});
						}
					}

					/*// Tell contentScript to take a screenshot and upload on Zenodo
					// Warning: do not open the inspection tool when running
					chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
						chrome.tabs.sendMessage(tabs[0].id, {
							message: "SCREENSHOT",
							payload: {
								token: ACCESS_TOKEN,
								depositId: depositId
							}
						});
					});*/
				}


			})
			.catch((error) => {
				console.error("Error creating deposit:", error);
			});
	});
}