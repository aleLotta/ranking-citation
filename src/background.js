// Go to options page when installed
chrome.runtime.onInstalled.addListener(() => {
	chrome.runtime.openOptionsPage();
});

/*// Publish after the uploading of the screenshots
let screenshotCount = 0;
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.message === "Uploaded Screenshot") {
		screenshotCount++;

		if (screenshotCount == request.payload.nPages) {
			const { payload: { depositId, ACCESS_TOKEN, uploadDestination } } = request;

			var publish = confirm(`The deposit has been uploaded to ${uploadDestination}. 
			\nAre you sure you want to publish the deposit? This operation is not reversible`);

			if (publish) {
				console.log("Deposit will be published");
				// post the deposit on Zenodo
				fetch(`${uploadDestination}api/deposit/depositions/${depositId}/actions/publish`, {
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
			} else {
				console.log("Publishing canceled");
			}
		}
	}
});*/

let data;
let queryText, searchSystem;
// Check if popup as said to start RO creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.cmd === 'CREATE RO') {
		chrome.storage.sync.get('nPages', function (items) {
			if (Object.keys(items).length !== 0) {
				const nPages = items.nPages;
				data = JSON.parse(request.payload.message);
				queryText = request.payload.title.split("-")[0].trim().toUpperCase();
				searchSystem = request.payload.title.split("-")[1].trim();
				getPagesRanks(nPages);
			}
		});
	}
});

let newData = []
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
	/*if (request.message === 'LAST PAGE') {
		const dataToAdd = request.payload.newData;
		for (let d in dataToAdd) {
			data['@graph'].push(dataToAdd[d]);
		}
		uploadData(data);
	}*/
});

async function getPagesRanks(nPages) {
	try {
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

			const url = new URL(tabs[0].url);
			const params = new URLSearchParams(url.search);
			const patentsFilter = params.get('as_sdt') ?? '0.5';
			const queryFilter = params.get('q');
			const languageFilter = params.get('hl') ?? 'en';
			const sinceYearFilter = params.get('as_ylo') ?? '';
			const untilYearFilter = params.get('as_yhi') ?? '';
			const sortByFilter = params.get('scisbd') ?? '0';
			const resultTypeFilter = params.get('as_rr') ?? '0';

			for (let i = 0; i < nPages; i++) {

				const startURL = 10 * i;
				//const pageURL = `https://scholar.google.com/scholar?start=${startURL}&as_sdt=2007&q=cancer&hl=en`;
				//const pageURL = `https://scholar.google.com/scholar?start=${startURL}&q=cancer&hl=en&as_sdt=0,5&as_vis=1`;
				const pageURL = `https://scholar.google.com/scholar?start=${startURL}&q=${queryFilter}&hl=${languageFilter}&as_sdt=${patentsFilter}&as_vis=1&` +
					`as_ylo=${sinceYearFilter}&as_yhi${untilYearFilter}&scisbd=${sortByFilter}&as_rr=${resultTypeFilter}`;
				chrome.tabs.create({ url: pageURL, active: false }, createdTab => {
					chrome.tabs.onUpdated.addListener(function _(tabId, info, tab) {
						if (tabId === createdTab.id && info.url) {
							chrome.tabs.onUpdated.removeListener(_);

							chrome.scripting.executeScript({
								target: {
									tabId: tabId
								},
								files: ['Scholar/getOtherPages.js']
							});
						}
					});
				});
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
				{
					"@id": "ranking-snapshot.png",
					"@type": "File",
					"author": {
						"@id": user_id
					},
					"encodingFormat": "image/png",
					"name": "screenshot"
				},
				user
			]
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
		// NB: this needs to have deposit:write access
		//let ACCESS_TOKEN = '1Rgx8cybYk1HwgqPFFlt0B9jsmPy5UKynS9lAUnswT6QjPVOBX6R0N4e5k9x';
		//let SANDBOX_ACCESS_TOKEN = 'gIMBAgJMUri3Xld9mTkjQxn7r0doszKXw6MlfGWZaG6FmnO2pnKCpggK29D3';
		//let ORCID = 'https://orcid.org/0009-0009-5047-606X'
		//let ZENODO_USER = "Alessandro Lotta";
		//let AFFILIATION = "Unipd";

		const tempDate = new Date;
		const pub_date = tempDate.toISOString().split('T')[0];
		const options = { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
		const pub_datetime = tempDate.toLocaleString('en-US', options);

		const TITLE = "Ranking snapshot for the query \"" + queryText + "\" performed on " + searchSystem;
		/*const NOTES = "This citation is created using the Unipd Ranking Citation Tool. \n" +
			"Available at https://rankingcitation.dei.unipd.it , \n" +
			"created by Gianmaria Silvello and Alessandro Lotta (University of Padua).";
		const DESCRIPTION = "This is a deposit containing the citation captured by the user " + ZENODO_USER + " from " + AFFILIATION +
			" at " + pub_datetime + " who executed the search query \"" + queryText + "\" on the system " + searchSystem + ".\n" +
			"The number of pages captured is " + nPages + ".\n" +
			"The data contained in the results obtained from the search query is then saved in the output-data.jsonld file. " +
			"The deposit also contains the screenshots of the results in PNG format and the metadata for the Research Object Crate in JSON format.\n" +
			NOTES;*/
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
						//orcid: "https://orcid.org/0000-0002-1825-0097"
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
						console.log("File uploaded successfully:", data);
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
						console.log("File uploaded successfully:", data);
					})
					.catch((error) => {
						console.error("Error uploading file:", error);
					});

				// Capture screenshot for the additional pages
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


			})
			.catch((error) => {
				console.error("Error creating deposit:", error);
			});
	});
}