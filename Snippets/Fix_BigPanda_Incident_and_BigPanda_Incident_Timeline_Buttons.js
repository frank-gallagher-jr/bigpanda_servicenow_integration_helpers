// These two snippets will overcome any issues you've run into for the BigPanda Incident 
// and BigPanda Incident Timeline buttons in case you have chosen not to enable 
// inclusion of the "Links" in the description field in version 2.9 of the integration

// Three steps required

// Step 1 - You need to add a column to the Incident table - System Definition > Tables > Incident
//         Column Label (column_label): "BigPanda URL" Column Name (element): "u_bigpanda_url"
//         Type (internal_type): URL, Max Length (max_length): 200

// Step 2 - BigPanda > Incidents > Transform Map > Field Maps - 
//          Do a direct map from u_bp_incident_url (BP import table) to the Incident Table's field "BigPanda URL"
//          aka the u_bigpanda_url column you just created

// Step 3 - Use SNUtils with Tools > Show Technical Names  enabled.  Click the "?" next to each button
//          on any BigPanda created incident and edit the code as follows - 


// BigPanda Incident Button
// Warm fix for customers who have chosen to disable incident links in their description

function openWindow() {
    var bp_inc_link = g_form.getValue('u_bigpanda_url');
    var incident_link_regex = /(https:\/\/[^\s]+\.bigpanda\.io\/[^\s]+)/;
    var extracted_link = bp_inc_link.match(incident_link_regex);

	if(extracted_link === undefined || extracted_link === null){
		alert("BigPanda's incident link NOT FOUND");
	}else{
		top.window.open(extracted_link[1], '_blank');
	}
    
}

// BigPanda Incident Timeline Button
// Warm fix for customers who have chosen to disable incident links in their description


function openWindow() {
    var bp_inc_link_timeline = g_form.getValue('u_bigpanda_url') + '/timeline';
    var incident_timeline_link_regex = /(https:\/\/[^\s]+\.bigpanda\.io\/[^\s]+\/timeline)/;
    var extracted_link = bp_inc_link_timeline.match(incident_timeline_link_regex);

	if(extracted_link === undefined || extracted_link === null){
		alert("BigPanda's incident timeline link NOT FOUND");
	}else{
		top.window.open(extracted_link[1], '_blank');
	}
}

