'use strict';

import './popup.css';

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

			chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
				if (request.message === "DEPOSIT DOI") {
					
				}
			})



		}
		else {
			const notAvailable = document.createElement('p');
			notAvailable.style = 'color: red';
			notAvailable.innerHTML = 'Citation is not available in this page';
			document.getElementById('content').appendChild(notAvailable);
		}

	});

});


