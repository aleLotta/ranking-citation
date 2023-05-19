'use strict';

import './popup.css';

// Set of the keys for the citation already stored
const keySet = new Set();

// Publish after the uploading of the screenshots
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

						const depositDOI = data.doi;
						const creators = data.metadata.creators;
						const title = data.metadata.title;
						const publication_date = data.metadata.publication_date;
						const publisher = "Zenodo";

						let creatorsText = "";
						for (let author of creators) {
							creatorsText += author.name + ", "
						}
						creatorsText = creatorsText.slice(0, -2);
						//const citation = creatorsText + ". " + title + " " + publication_date + ". " + publisher +
						//	". (Version " + version + "). ";
						const citation = creatorsText + ". " + title + " (" + publication_date + "). " + publisher + ". ";

						chrome.storage.sync.set({ [depositDOI]: citation }).then(() => {
							//console.log("Value is set to " + citation);
						});

						updateCitations(depositDOI);

					})
					.catch((error) => {
						console.error("Error publishing deposit:", error);
					});
			} else {
				console.log("Publishing canceled");
			}
		}
	}
});

document.addEventListener("DOMContentLoaded", function (event) {

	// implement the fact that this is returned if the page is not the correct URL
	// I can use a message from the content-script
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		let currentUrl = tabs[0].url;

		if (currentUrl.match('https://scholar.google.com/scholar*') || currentUrl.match('https://twitter.com/search*')) {

			document.getElementById('content').innerHTML += '<button id="captureBtn">Capture Snapshot</button>';

			// button for capturing the snapshot
			document.getElementById('captureBtn').addEventListener('click', function () {

				// Send message to content script to start capturing data
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					chrome.tabs.sendMessage(tabs[0].id, { message: "START" }, function (response) {
						const para = document.createElement('p');
						para.innerHTML = response.data;

						let rocrateData;
						let DOI;
						const data = response.data;
						const title = response.title;

						// Send message to background.js for creating RO-Crate
						chrome.runtime.sendMessage(
							{
								cmd: 'CREATE RO',
								payload: {
									message: data,
									title: title
								},
							},
							//(response) => {
							//	console.log(response.response)
							//	rocrateData = response.payload.content;
							//}
						);

					});
				});
			});

			/*// receive deposit content from background script
			chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
				if (request.message === "DEPOSIT DATA") {
					const depositDOI = request.payload.depositDOI;
					const creators = request.payload.creators;
					const title = request.payload.title;
					const publication_date = request.payload.publication_date;
					const publisher = request.payload.publisher;
					//const version = request.payload.version;

					let creatorsText = "";
					for (let author of creators) {
						creatorsText += author.name + ", "
					}
					creatorsText = creatorsText.slice(0, -2);
					//const citation = creatorsText + ". " + title + " " + publication_date + ". " + publisher +
					//	". (Version " + version + "). ";
					const citation = creatorsText + ". " + title + " (" + publication_date + "). " + publisher + ". ";

					chrome.storage.sync.set({ [depositDOI]: citation }).then(() => {
						//console.log("Value is set to " + citation);
					});

					updateCitations(depositDOI);

				}
			});*/

			//chrome.storage.sync.clear(function () {
			//	let error = chrome.runtime.lastError;
			//	if (error) {
			//		console.error(error);
			//	}
			//	// do something more
			//});

		}
		else {
			const notAvailable = document.createElement('p');
			notAvailable.id = "warningPara";
			notAvailable.innerHTML = 'Citation is not available in this page';
			document.getElementById('content').appendChild(notAvailable);
		}

		// Event handler for opening options page
		const optionsBtn = document.getElementById("optionsBtn");
		optionsBtn.addEventListener("click", function () {
			if (chrome.runtime.openOptionsPage) {
				chrome.runtime.openOptionsPage();
			} else {
				window.open(chrome.runtime.getURL('options.html'));
			}
		});

		document.getElementById("content").appendChild(document.createElement("hr"));
		const citHeading = document.createElement("h3");
		citHeading.id = "citHeading";
		citHeading.innerHTML = "Your Citations";
		document.getElementById("content").appendChild(citHeading);
		chrome.storage.sync.get(null, function (items) {
			let allKeys = Object.keys(items);
			const regex = /^\d+/;
			for (let i = 0; i < allKeys.length; i++) {
				let key = allKeys[i];
				if (regex.test(key)) {
					updateCitations(key);
				}
			}
		});
	});

});

function updateCitations(key) {
	chrome.storage.sync.get([key]).then((result) => {
		if (!(keySet.has(key))) {
			const citationDiv = document.createElement("div");
			citationDiv.className = "citation";
			const citationText = document.createElement("div");
			//citationText .className = "citation";
			citationText.innerHTML = result[key];
			const citationLink = "https://doi.org/" + key;
			const citationAnchor = document.createElement("a");
			citationAnchor.href = citationLink;
			citationAnchor.innerHTML = citationLink;
			citationAnchor.target = "_blank";
			citationText.appendChild(citationAnchor);
			citationDiv.appendChild(citationText);

			// button to copy the citation
			const buttonsDiv = document.createElement("div");
			buttonsDiv.id = 'buttonsDiv';
			const copyButton = document.createElement("i");
			copyButton.className = "fa fa-copy";
			copyButton.id = "copyBtn";
			copyButton.addEventListener('click', () => {
				const text = citationText.innerText;
				navigator.clipboard.writeText(text).then(() => {
					console.log('Copied "${text}" to clipboard');
					copyButton.style = "color:green";
				})
			})

			const removeCitBtn = document.createElement('i');
			removeCitBtn.className = "fa fa-remove";
			removeCitBtn.id = 'removeCitBtn';
			removeCitBtn.addEventListener('click', () => {
				chrome.storage.sync.remove(key);
				citationDiv.remove();
			})

			buttonsDiv.appendChild(copyButton);
			buttonsDiv.appendChild(removeCitBtn);
			citationDiv.appendChild(buttonsDiv);

			document.getElementById("content").appendChild(citationDiv);

			keySet.add(key);
		}
		else {
			console.log(key);
			alert("Ranking Already Captured");
		}
	});
}


