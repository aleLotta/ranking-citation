// Go to options page when installed
chrome.runtime.onInstalled.addListener(() => {
	chrome.runtime.openOptionsPage();
})


// Check if popup as said to start RO creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.cmd === 'CREATE RO') {


		chrome.storage.sync.get(['accessToken', 'firstName', 'lastName', 'affiliation', 'orcid', 'keywords', 'otherAuthors'], function (items) {
			const ACCESS_TOKEN = items.accessToken;
			const ZENODO_USER = items.firstName + " " + items.lastName;
			const AFFILIATION = items.affiliation;
			const ORCID = items.orcid;
			const NEW_KEYWORDS = items.keywords;

			const otherAuthors = items.otherAuthors.split(";");

			// Log message coming from the `request` parameter
			const data = request.payload.message;

			const currentTimeStamp = new Date();

			const user_id = ORCID;
			const user = {
				"@id": user_id,
				"@type": "Person",
				"name": ZENODO_USER,
				"affiliation": AFFILIATION,
			};

			let RC = {
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
			sendResponse({
				response: "RO created",
				payload: {
					content: RC
				}
			});

			// create File variable for gathered data
			const dataBlob = new Blob([data], { type: 'application/ld+json' });
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

			const queryText = request.payload.title.split("-")[0].trim().toUpperCase();
			const searchSystem = request.payload.title.split("-")[1].trim();
			const tempDate = new Date;
			const pub_date = tempDate.toISOString().split('T')[0];

			const TITLE = "Ranking snapshot for the query \"" + queryText + "\" performed on " + searchSystem;
			const NOTES = "This citation is created using the Unipd Citation Ranking Tool. \n" +
				"Available at https://citationranking.dei.unipd.it \n" +
				"Created by professor Gianmaria Silvello and student Alessandro Lotta";
			const DESCRIPTION = "This is a deposit containing the citation captured by the user " + ZENODO_USER + " from affiliation " + AFFILIATION +
				" on date " + pub_date + " who executed the search query: \"" + queryText + "\" on the engine " + searchSystem + ".\n" +
				"The data contained in the results obtained from the search query is then saved in the output-data.jsonld file. " +
				"The deposit also contains a screenshot of the results in PNG format and the metadata for the Research Object Crate in JSON format.\n" +
				NOTES;

			let keywords = ["Unipd Citation Ranking Tool", queryText, searchSystem, "Ranking Snapshot"];
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
							//orcid: author.split(',')[1]
							orcid: "https://orcid.org/0000-0002-1825-0097"
						}
					);
				}
			}

			console.log(depositAuthors);

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

			fetch("https://sandbox.zenodo.org/api/deposit/depositions", {
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
						})
						.catch((error) => {
							console.error("Error uploading file:", error);
						});

					// Upload the crate file 
					const formData2 = new FormData();
					formData2.append("file", crateFile);

					fetch(`https://sandbox.zenodo.org/api/deposit/depositions/${depositId}/files`, {
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

					// Tell contentScript to take a screenshot and upload on Zenodo
					// Warning: do not open the inspection tool when running
					chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
						chrome.tabs.sendMessage(tabs[0].id, {
							message: "SCREENSHOT",
							payload: {
								token: ACCESS_TOKEN,
								depositId: depositId
							}
						});
					});
				})
				.catch((error) => {
					console.error("Error creating deposit:", error);
				});

			/*// send to popup the DOI
			chrome.runtime.sendMessage({
				message: "DEPOSIT DOI",
				payload: {
					//depositDOI: data.doi,
					//creators: data.metadata.creators,
					//title: data.metadata.title,
					//publication_date: data.metadata.publication_date,
					//publisher: "Zenodo",
					//version: data.metadata.version
					depositDOI: "10.5281/zenodo.7796232",
					creators: ["Carbon", "Seth", "Mungall", "Chris"],
					title: "Gene Ontology Data Archive [Data set]",
					publication_date: "2023-04-01",
					publisher: "Zenodo",
					version: "1.0"
				}
			});
			chrome.runtime.sendMessage({
				message: "DEPOSIT DOI",
				payload: {
					depositDOI: "10.5281/zenodo.7812326",
					creators: ["Banda", "Juan M.", "Tekumalla", "Ramya", "Wang"],
					title: "A large-scale COVID-19 Twitter chatter dataset for open scientific research - an international collaboration [Data set]",
					publication_date: "2023",
					publisher: "Zenodo",
					version: "1.0"
				}
			});*/
		});


	}
});