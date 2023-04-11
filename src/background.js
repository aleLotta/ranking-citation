
// Check if popup as said to start RO creation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.cmd === 'CREATE RO') {

		// Log message coming from the `request` parameter
		const data = request.payload.message;
		//const imgScreenShot = request.payload.image;
		//let imgScreenShot;
		//chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
		//	imgScreenShot = request.image;
		//	console.log(imgScreenShot);
		//
		//	imgScreenShot.toBlob(function (blob) {
		//		console.log(blob);
		//	})
		//});

		// console.log(data);
		// Send a response message
		// sendResponse({
		// 	message,
		// });

		// Creation of the Research Object Crate
		//const { ROCrate } = require('ro-crate');
		//const crate = new ROCrate();
		//console.log('Imported ro-crate correctly');

		const currentTimeStamp = new Date();

		const user_id = "https://orcid.org/0000-0000-0000-0000";
		const user = {
			"@id": user_id,
			"@type": "Person",
			"name": "User1",
			"affiliation": "Unipd"
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
		const ACCESS_TOKEN = '1Rgx8cybYk1HwgqPFFlt0B9jsmPy5UKynS9lAUnswT6QjPVOBX6R0N4e5k9x';
		const pub_date = new Date().getDate;

		const depositMetadata = {
			metadata: {
				title: "Ranking Snapshot",
				upload_type: "dataset",
				publication_date: pub_date,
				description: "This is a test deposit created via the Zenodo API",
				creators: [
					{
						name: "Alessandro Lotta",
						affiliation: "Unipd",
					},
				],
			},
		};

		fetch("https://zenodo.org/api/deposit/depositions", {
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

				// Upload the crate file 
				const formData2 = new FormData();
				formData2.append("file", crateFile);

				fetch(`https://zenodo.org/api/deposit/depositions/${depositId}/files`, {
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
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					chrome.tabs.sendMessage(tabs[0].id, {
						message: "SCREENSHOT",
						payload: {
							token: ACCESS_TOKEN,
							depositId: depositId
						}
					});
				});


				// send to popup the DOI
				chrome.runtime.sendMessage({
					message: "DEPOSIT DOI",
					payload: {
						//depositDOI: data.doi,
						depositDOI: "10.5281/zenodo.7796232"
					}
				})
				
			})
			.catch((error) => {
				console.error("Error creating deposit:", error);
			});
	}
});