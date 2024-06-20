// Push Incidents from ServiceNow into BigPanda via Open Integration Manager (OIM) 
//  F. Gallagher | BigPanda | 2024


/*   
  1.) Go into BigPanda and create an OIM integration 
  2.)  Gather Bearer Token and App Key from the OIM configuration page
  3.)  Set system properties in ServiceNow BigPanda scope (start with x_bip_panda._______)  with the values for bearer token and app key
  4.)  Update the variables with the names of these system properties below.
  5.)  Create a Business Rule in advanced mode which looks for newly created incidents and executes after creation (recommend only on insert)
  6.)  Save the business rule & Create a test incident inside of ServiceNow
  7.)  Check BigPanda looking for your incident as a BigPanda incident from the source name you used during OIM creation

Considerations -
- If you're not considerate of your approach with correlation, you could mistakenly correlate incidents in an unwanted way.  Use caution.
- If you're not considerate of how you create your AutoShare rules, you could create an incident loop with ServiceNow opening incidents from ServiceNow Incidents.  Be sure to use common sense and care when implementing.

  */ 

(function executeRule(current, previous /*null when async*/ ) {
    var restMessage = new sn_ws.RESTMessageV2();
	// Gather Bearer from system property or use the one defined in the Configuration Page
    var bearerToken = gs.getProperty('x_bip_panda.<custom bearer token>'); 
   	//var request.setRequestHeader("Authorization", "Bearer " + gs.getProperty('x_bip_panda.bearerToken'));
	// set  an app key from an Open Integration Manager configuration page 
    var appKey = gs.getProperty('x_bip_panda.<custom app key for oim to use>'); // Set New App Key For This

    restMessage.setHttpMethod("post");
	restMessage.setHTTPTimeout(7000);  // Wait a maximum number of seconds before timing out
    restMessage.setRequestHeader('Authorization', 'Bearer ' + bearerToken);
    restMessage.setRequestHeader("Content-Type", "application/json");
    restMessage.setEndpoint('https://integrations.bigpanda.io/oim/api/alerts');

    var bigpandaBlocker = "true"; // Use this tag in environments and correlation rules to prevent unwanted behavior and AutoShare looping

 
	var body = {
			app_key: appKey,
			description: current.description.getDisplayValue(),
			sn_assigned_to: current.assigned_to.getDisplayValue(),
			sn_assignment_group: current.assignment_group.getDisplayValue(),
			sn_blocker: bigpandaBlocker,
			sn_business_duration: current.business_duration.getDisplayValue(),
			sn_business_impact: current.business_impact.getDisplayValue(),
			sn_business_service: current.business_service.getDisplayValue(),
			sn_calendar_duration: current.calendar_duration.getDisplayValue(),
            sn_caller_id: current.caller_id.getDisplayValue(),
			sn_category: current.category.getDisplayValue(),
			sn_cmdb_ci: current.cmdb_ci.getDisplayValue(),
			sn_correlation_id: current.correlation_id.getDisplayValue(),
			sn_escalation: current.escalation.getDisplayValue(),
			sn_inc_sys_id: current.sys_id.getDisplayValue(),
			sn_incident_number: current.number.getDisplayValue(),
			sn_integration_team: bigpandaTeamID,
			sn_impact: current.impact.getDisplayValue(),
			sn_location: current.location.getDisplayValue(),
			sn_opened_at: current.opened_at.getDisplayValue(),
			sn_priority: current.priority.getDisplayValue(),
			sn_reassignment_count: current.reassignment_count.getDisplayValue(),
			sn_ropen_count: current.reopen_count.getDisplayValue(),
			sn_resolved_at: current.resolved_at.getDisplayValue(),
			sn_service_offering: current.service_offering.getDisplayValue(),
			sn_severity: current.severity.getDisplayValue(),
			sn_short_desc: current.short_description.getDisplayValue(),
			sn_state: current.state.getDisplayValue(),
			sn_subcategory: current.subcategory.getDisplayValue(),
			sn_time_worked: current.time_worked.getDisplayValue(),
			sn_urgency: current.urgency.getDisplayValue(),
			status: (current.state.getDisplayValue().toLowerCase() === "resolved" || current.state.getDisplayValue().toLowerCase() === "closed") ? "ok" : "critical"
	};
		
    restMessage.setRequestBody(JSON.stringify(body));
    var response = restMessage.executeAsync();
    response.waitForResponse(7); // Maximum of 7 seconds before timing out
    var httpResponseStatus = response.getStatusCode();
    //gs.info(restMessage.getBody());
    gs.info("Incident Synchronized to BigPanda - " + ticket_number);
})(current, previous);