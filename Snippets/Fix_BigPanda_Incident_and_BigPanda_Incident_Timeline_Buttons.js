// USAGE AND GUIDANCE
//   YOU MUST READ THIS PART - 
//     Before applying this warm fix within your ServiceNow, be sure to understand the following: 
// 			These snippets are provided without warranty, guarantee, and support. 
//			Use this guidance and code AT YOUR OWN RISK.
//			This should be used for reference purposes, but you need to use your own judgement. 
//
//			Test in a lower ServiceNow instance first! 
//			Always define a specific update set when applying changes to ServiceNow!
//			Don't be a hero and wind up with zero. 
//
//										 - F. Gallagher 2024

// PURPOSE 
//
// These two snippets will overcome any functionality issues you've run into for the BigPanda Incident 
// and BigPanda Incident Timeline buttons due to configuration choices that you made which remove the 
// prerequisite data from the expected field.  

//			If you're not sure if this code applies to you, assume that it doesn't.
//			You'd know if you needed this, I promise. 

// How to apply -

// Prerequisite - You need ServiceNow Admin privs and you need to be able to change scope
// 		BigPanda is the Application Scope you need.  
//			IF YOU DON'T HAVE THIS STOP HERE AND SEEK A SERVICENOW ADMIN / ENGINEER / ARCHITECT

// Step 1 - You need to add a column to the Incident table - System Definition > Tables > Incident
//         Column Label (column_label): "BigPanda URL" Column Name (element): "u_bigpanda_url"
//         Type (internal_type): URL, Max Length (max_length): 200

// Step 2 - BigPanda > Incidents > Transform Map > Field Maps - 
//          Do a direct map from u_bp_incident_url (BP import table) to the Incident Table's field "BigPanda URL"
//          aka the u_bigpanda_url column you just created

// Step 3 - Use SNUtils with Tools > Show Technical Names  enabled.  Click the "?" next to each button
//          on any BigPanda created incident and edit the code as follows - 


// BigPanda Incident Button - Button 1
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

// BigPanda Incident Timeline Button - Button 2 
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

// Make sure you apply this to both buttons. 
