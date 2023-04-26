'use strict';

import './popup.css';

// Set of the keys for the citation already stored
const keySet = new Set();

document.addEventListener("DOMContentLoaded", function (event) {

	// implement the fact that this is returned if the page is not the correct URL
	// I can use a message from the content-script
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		var currentUrl = tabs[0].url;

		if (currentUrl.match('https://scholar.google.com/scholar*')) {

			document.getElementById('content').innerHTML += '<button id="captureBtn">Capture Snapshot</button>';

			// button for capturing the snapshot
			document.getElementById('captureBtn').addEventListener('click', function () {

				// Send message to content script to start capturing data
				chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
					chrome.tabs.sendMessage(tabs[0].id, { message: "START" }, function (response) {
						const para = document.createElement('p');
						para.innerHTML = response.data;
						//document.getElementById('content').appendChild(para);

						// Save json-ld file
						var blob = new Blob([response.data], { type: "application/ld+json;charset=utf-8" });

						//var url = URL.createObjectURL(response.image);
						//chrome.downloads.download({
						//  url: url,
						//  filename: "output.jsonld",
						//  conflictAction: "overwrite"
						//});

						let rocrateData;
						let DOI;

						// Send message to background.js for creating RO-Crate
						chrome.runtime.sendMessage(
							{
								cmd: 'CREATE RO',
								payload: {
									message: response.data,
									title: response.title
								},
							},
							(response) => {
								console.log(response.response)
								rocrateData = response.payload.content;
							}
						);

						/*let butDirectory = document.createElement('button');
						butDirectory.id = "butDirectory";
						butDirectory.innerHTML = "Open";
			
						butDirectory.addEventListener('click', async () => {
			
						  // write file with gathered data
						  let options = {
							types: [
							  {
								description: "JSON-LD File",
								accept: {
								  "application/ld+json": [".jsonld"],
								}
							  }
							],
							suggestedName: 'output-data.jsonld'
						  };
			
						  let handle = await window.showSaveFilePicker(options);
						  let writable = await handle.createWritable();
			
						  await writable.write(response.data);
						  await writable.close();
			
			
						  // write RO-Crate file
						  options = {
							types: [
							  {
								description: "RO-Crate File",
								accept: {
								  "application/json": [".json"],
								}
							  }
							],
							suggestedName: 'ro-crate-metadata.json'
						  };
			
						  handle = await window.showSaveFilePicker(options);
						  writable = await handle.createWritable();
			
						  await writable.write(JSON.stringify(rocrateData, null, 2));
						  await writable.close();
			
						  return handle;
						});
			
						document.getElementById('content').append(butDirectory);*/
					});
				});
			});

			// receive deposit content from background script
			chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
				if (request.message === "DEPOSIT DOI") {
					const depositDOI = request.payload.depositDOI;
					const creators = request.payload.creators;
					const title = request.payload.title;
					const publication_date = request.payload.publication_date;
					const publisher = request.payload.publisher;
					const version = request.payload.version;

					let creatorsText = "";
					for (let author of creators){
						creatorsText += author + ", "
					}
					creatorsText = creatorsText.slice(0,-2);
					const citation = creatorsText + ". " + title + " " + publication_date + ". " + publisher +
						". (Version " + version + "). ";

					chrome.storage.sync.set({ [depositDOI]: citation }).then(() => {
						//console.log("Value is set to " + citation);
					});

					updateCitations(depositDOI);

				}
			});

			//chrome.storage.sync.clear(function () {
			//	var error = chrome.runtime.lastError;
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
			var allKeys = Object.keys(items);
			const regex = /^\d+/;
			for (var i = 0; i < allKeys.length; i++) {
				var key = allKeys[i];
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
			citationDiv.appendChild(copyButton);

			document.getElementById("content").appendChild(citationDiv);

			keySet.add(key);
		}
		else {
			console.log(key);
			alert("Ranking Already Captured");
		}
	});
}


