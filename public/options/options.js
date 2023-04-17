'use strict'

document.addEventListener("DOMContentLoaded", function (event) {
    chrome.storage.sync.get(['accessToken', 'firstName', 'lastName', 'affiliation'], function (items) {
        if (Object.keys(items).length !== 0) {
            document.getElementById("atoken").value = items.accessToken;
            document.getElementById("fname").value = items.firstName;
            document.getElementById("lname").value = items.lastName;
            document.getElementById("affiliation").value = items.affiliation;
        }
    });

    document.getElementById("options-form").addEventListener("submit", saveOptions);

});

function saveOptions(event) {
    event.preventDefault();
    console.log("saving options");
    var accessToken = document.getElementById("atoken").value;
    var firstName = document.getElementById("fname").value;
    var lastName = document.getElementById("lname").value;
    var affiliation = document.getElementById("affiliation").value;

    chrome.storage.sync.set({
        accessToken: accessToken,
        firstName: firstName,
        lastName: lastName,
        affiliation: affiliation
    }, function () {
        // Notify the user that the options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        document.getElementsByTagName("fieldset")[0].style = "border: 4px solid green;";
        setTimeout(function () {
            status.textContent = '';
            document.getElementsByTagName("fieldset")[0].style = "border: 2px solid #ccc;";
        }, 1500);
    });
}