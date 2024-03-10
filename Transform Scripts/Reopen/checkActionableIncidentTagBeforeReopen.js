// Customized BigPanda - Reopen ServiceNow Incident Logic

// Check the Incident Tag named actionable for true before reopening an incident
// Apply to Reopen Transform Script and use Incident Tag logic to check for alerts which
// are active and are flagged as actionable before reopening the incident 

// Incident Tag BPFL Logic - IF (FILTER(actionable, alert_status, !=, ok) = true, "true", "false")
 
// This script prevents BigPanda correlated low importance alerts from reopening an incident ticket when that's unwanted behavior

(function runTransformScript(source, map, log, target /*undefined onStart*/ ) {
    // Retrieve configuration form inputs
    var reopenServiceNowIncident = (gs.getProperty("x_bip_panda.reopenServiceNow") == 'true');
    var reopenWindow = parseInt(gs.getProperty("x_bip_panda.reopenWindow", "0"));

    // Retrieve ServiceNow incident Display State
    var incidentState = target.getDisplayValue("state").toLowerCase();
	var incidentNum = target.getDisplayValue("number"); 

    // Retrieve the current time for comparison
    var currentTime = new GlideDateTime();

	var reopen = (source.u_bp_event_type) ? source.u_bp_event_type == 'incident#reopen' : source.u_bp_incident_status != 'ok';
		
	actionableReopen = (function TransformEntry(source) {
		var bpUtils = new x_bip_panda.BigPandaUtility(source);
		var incidentActionable = bpUtils.getIncidentTag('actionable');
		return incidentActionable;
	}) (source);

    
	// Adjust resolve time forward by reopen window in minutes
    // if ServiceNow incident is resolved and share is active, reopen or create
    if (incidentState == 'resolved' && reopen && actionableReopen) {
        // Retrieve ServiceNow Incident Resolve time
        var resolveTime = new GlideDateTime(target.getValue("resolved_at"));
		
		gs.info(incidentNum + ' - Time and Date: ' + currentTime + '- Reopen: ' + reopen + ' - BigPanda Incident Actionable Flag: ' + actionableReopen);

        resolveTime.add(reopenWindow * 60 * 1000);

        // Reopen ServiceNow incident
        if (currentTime.before(resolveTime) && reopenServiceNowIncident) {
            target.setValue("state", 2);
            target.update();
        }
    }
})(source, map, log, target);