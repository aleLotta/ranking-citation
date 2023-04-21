'use strict'

document.addEventListener("DOMContentLoaded", function (event) {
    chrome.storage.sync.get(['accessToken', 'firstName', 'lastName', 'affiliation', "orcid"], function (items) {
        if (Object.keys(items).length !== 0) {
            document.getElementById("atoken").value = items.accessToken;
            document.getElementById("fname").value = items.firstName;
            document.getElementById("lname").value = items.lastName;
            document.getElementById("affiliation").value = items.affiliation;
            document.getElementById("orcid").value = items.orcid;
        }
    });

    document.getElementById("options-form").addEventListener("submit", saveOptions);

    // ADD default Keywords
    const defaultKeywords = ["Unipd Citation Ranking Tool", "Ranking Snapshot", "$queryText", "$searchSystem"]
    defaultKeywords.forEach(keyword => {
        const list = document.getElementById('keyword-list');
        const item = document.createElement('div');
        item.id = 'keyword-stored';
        const keywordText = document.createElement("span");
        keywordText.style = "margin-right:5px"
        keywordText.textContent = keyword;
        item.appendChild(keywordText);
        list.appendChild(item);
    });

    chrome.storage.sync.get(['keywords'], function(items) {
        const keyws = items.keywords;
        for (let item of keyws) {
            createKeywordDiv(item);
        }
    });

    document.getElementById("add-keyword").addEventListener('click', addKeyword);

});

function saveOptions(event) {
    event.preventDefault();
    console.log("saving options");
    var accessToken = document.getElementById("atoken").value;
    var firstName = document.getElementById("fname").value;
    var lastName = document.getElementById("lname").value;
    var affiliation = document.getElementById("affiliation").value;
    var orcid = document.getElementById("orcid").value;
    var keywordsElement = document.getElementsByClassName("keyText");

    var keywords = [];
    for (let element of keywordsElement) {
        keywords.push(element.innerText);
    }

    chrome.storage.sync.set({
        accessToken: accessToken,
        firstName: firstName,
        lastName: lastName,
        affiliation: affiliation,
        orcid: orcid,
        keywords: keywords
    }, function () {
        // Notify the user that the options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        document.getElementsByTagName("fieldset")[0].style = "border: 4px solid green;";
        document.getElementsByTagName("fieldset")[1].style = "border: 4px solid green;";
        setTimeout(function () {
            status.textContent = '';
            document.getElementsByTagName("fieldset")[0].style = "border: 2px solid #ccc;";
            document.getElementsByTagName("fieldset")[1].style = "border: 2px solid #ccc;";
        }, 1500);
    });
}

function addKeyword() {
    const input = document.getElementById('keywords');
    const keyword = input.value.trim();
    if (keyword !== '') {
        createKeywordDiv(keyword);
        input.value = '';
    }
}

function createKeywordDiv(keyword) {
    const list = document.getElementById('keyword-list');
    const item = document.createElement('div');
    item.id = 'keyword-stored';
    const keywordText = document.createElement("span");
    keywordText.className = "keyText";
    keywordText.style = "margin-right:5px"
    keywordText.textContent = keyword;
    const removeBtn = document.createElement("i");
    removeBtn.className = "fa fa-remove";
    removeBtn.addEventListener("click", function () {
        item.remove();
    });
    item.appendChild(keywordText);
    item.appendChild(removeBtn);
    list.appendChild(item);
}