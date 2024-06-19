/*  BigPanda Integration - ServiceNow On-Hold = BigPanda Snoozed (Script Action)
    ----
    F. Gallagher (BigPanda) | June 2024 | Many thanks to P. Khoo (United Airlines) for assistance with development and testing.
    ----
    Purpose:  Snooze BigPanda incidents that are placed "on hold" in ServiceNow 
    ----
    Usage Note: 
        LOGS TO: System Logs > Application Logs (syslog_app_scope_list.do) - Hint: Filter "BigPanda" App Scope or "x_bip_panda" Source
        BIGPANDA INTEGRATION VERSION SUPPORT: BigPanda ServiceNow Integration Version 2.8 or newer recommend minimum, but it will likely work on older and newer version (potentially may require tweaks)
        SERVICENOW VERSION SUPPORT: Should work in all recent ServiceNow versions, may require minor tweaks to align with customer-made customizations in ServiceNow instance
        TESTED: Confirmed to work in (unmodified) Vancouver Patch 8 with OOTB (unmodified) BigPanda V2.9 Integration.
                

    ----
    Implementation: 
    
    Generalized ServiceNow Requirements and Implementation Steps Checklist -  

        For any scripts like this to work, the BigPanda Integration MUST BE INSTALLED and CONFIGURED.  Use the checklist below before complaining it doesn't work, please.
        
        CHECKLIST: 

        -- ALL STEPS MUST BE EXECUTED WHILE IN THE BIGPANDA APPLICATION SCOPE LOGGED IN AS WITH SERVICENOW ADMINISTRATOR PRIVS --
        
        Browse to the BigPanda > Configuration Page (x_bip_panda_Configuration.do) inside of ServiceNow - 
        
        Before you continue... CONFIRM that you've completed the following: 
            Make sure you have applied the Org Bearer Token (this can be retrieved from BigPanda UI ServiceNow Integration Page)
            Make sure you have applied the Incident App Key (this can be retrieved from BigPanda UI ServiceNow Integration Page)
            Make sure you have applied the (Integration) User API Key ([starts with BPU...] if you haven't set one up, do this in the BigPanda UI)
            
        Did you make any changes?  Confirm you're in the BigPanda Application Scope and scroll to the bottom and click Submit to save them.
        
        ServiceNow User Administration (sys_user.do) 
            BigPanda User and Role Assignment: 
            Before you continue... CONFIRM that you have completed the following 
                Make sure you have created a "BigPanda" user inside of ServiceNow for the BigPanda integration .  
                 --Make sure you've set a password for this user.  
                 --Make sure you've shut off Password Needs Reset. 
                 --Make sure the user is Active
                 --Make sure the "Web service access only" is checked unless you have a known reason not to have this checked
                Make sure the aforementioned user has the x_bip_panda_user role applied in SN Roles Tab in User Administration -- THIS IS IMPORTANT
                Make sure the user and password for the ServiceNow BigPanda user exists in the Integration configuration within BigPanda UI
        
        Incident Integration Confirmation:   

            Make sure you can share incidents from BigPanda to ServiceNow and synchronization of work notes and state changes is working -->bidirectionally<--
        

        SNOOZE = ON HOLD 

        Inside of ServiceNow, Logged In As Administrator ---> Application Scope:  BigPanda <--- IMPORTANT 
        
        Define an event to listen for: 

            Within System > Event Registry - Create an Event (name it something like "x_bip_panda.BigPanda.snoozeIncident") 
                Settings are generally as follows: Select Incident table, 100 order is normally fine, Description:  Triggers On Hold state change to snooze BigPanda Incident                    

        Define what triggers this event:
                
            Within System Definition > Business Rules - Create a Business Rule (name it something like "BigPanda On Hold Sync Snoozed") 
                - Active and Advanced must be checked
                    When to Run tab - after - 100 is fine - Update checked (no need for the others, generally)
                        Filter Condition should be BigPanda ID is not empty ---AND--- Incident State "Changes To" On Hold
                    Advanced tab - Condition should be something like, consider other conditions as needed --- gs.getProperty('x_bip_panda.IncidentsActive') == 'true'
                    Script --- function executeRule(current) {  gs.eventQueue("x_bip_panda.BigPanda.snoozeIncident", current); })(current);

        Define the required action when the event has occured: 

            Within System Policy > Events > Script Action (sysevent_script_action_list.do) --- Create a Script Action (Name it something like "ProcessBigPandaSnoozeOnHold") 
                - Find and select the Event Registry Event name you created/referenced in aforementioned steps (i.e. x_bip_panda.BigPanda.snoozeIncident)
                - Apply script logic for BigPanda Incident SNOOZE 
                

        Define variables used by the Script Action in a centralized way via a System Property:

            Create a system property (sys_properties.do) for 
                Incident Environment ID referenced in the Snooze Script Action -- x_bip_panda.AllEnvironmentsID  (alternative - x_bip_panda.<specificEnvId> - Make sure API user can snooze in the environment you're setting)
                Snooze Scheduling -- x_bip_panda.snoozeTimeOverride -- Integer value of snoozeDays defaults to + 7 days from time of On Hold state change [maximum snooze time is 89.99 days - 90.00 days can fail, so aim lower]
                Cancel on incident updates --  x_bip_panda.snoozeCancelOnUpdates -- Should the incident become unsnoozed if it is updated?  
                    If true - Any updates to incident (like alert state changes) on the BigPanda side will cancel the snooze.  Expiry date time,  manual cancellation of the snooze in BP, and/or incident state changes away from On Hold will cancel the snooze.
                    If false - All updates to the incident will be ignored.  The snooze will continue until expiry date and time -- or -- until manually unsnoozed in BigPanda -- or -- until On Hold state changes (if unsnooze is scripted)

        For Snooze = We need HTTP PUT  --- Comments are included for clarity
        For Unsnooze / Cancel = We NEED HTTP DELETE --- No comments are possible via this method
        
        --- 

        Reference Incident States Display Names and State Codes
            'New': 1,
            'In Progress': 2,
            'On Hold': 3,
            'Resolved': 6,
            'Closed': 7,
            'Canceled': 8


*/



(function executeScript(current, event) {
    try {
        // Fetch required properties and validate
        var bpEnvId = gs.getProperty('x_bip_panda.AllEnvironmentsID') || '';
        var bpID = current.getValue("x_bip_panda_bigpanda_id") || '';
        var snoozeDays = parseInt(gs.getProperty('x_bip_panda.snoozeTimeOverride', '7')) || 7;
        var cancelOnIncidentUpdates = gs.getProperty('x_bip_panda.snoozeCancelOnUpdates', 'true') === 'true';

        // Validate critical properties
        if (!bpEnvId) {
            throw new Error('Environment ID is missing.');
        }
        if (!bpID) {
            throw new Error('BigPanda Incident ID is missing.');
        }

        // Incident details
        var incidentStateCurrent = current.state ? current.state.getDisplayValue() : '';
        var incidentTicketNumber = current.number ? current.number.getDisplayValue() : '';
        var bpActionType = '';
        var commentAnnotation = '';
        var commentSnooze = '';

        // Validate incident details
        if (!incidentStateCurrent || !incidentTicketNumber) {
            throw new Error('Incident state or ticket number is missing.');
        }

        // Date and time calculation
        var currentDateTime = new GlideDateTime();
        currentDateTime.addDaysLocalTime(snoozeDays);
        var snoozeTilDateTime = currentDateTime.getDisplayValue();
        var endTime = parseInt(currentDateTime.getNumericValue() / 1000);

        if (!snoozeTilDateTime) {
            throw new Error('Failed to calculate snooze until date and time.');
        }

        // Snooze comments
        if (cancelOnIncidentUpdates === false) {
            commentSnooze = 'ServiceNow Incident ' + incidentTicketNumber + ' On Hold -  Auto-Snooze BigPanda Incident.  The incident state changed to On Hold.  This incident will be snoozed until ' + snoozeTilDateTime + '.  The snooze can be cancelled manually in BigPanda or by changing the ServiceNow incident state to something other than On Hold.';
        } else if (cancelOnIncidentUpdates === true) {
            commentSnooze = 'ServiceNow Incident ' + incidentTicketNumber + ' On Hold - Auto-Snooze BigPanda Incident.  The incident state changed to On Hold.  This incident will be snoozed until ' + snoozeTilDateTime + '.  The snooze will be cancelled by alert state changes or updates.  The snooze can also be cancelled manually in BigPanda or by changing the ServiceNow incident state to something other than On Hold.';
        }

        // Setup the Endpoint and the HTTP REST Message common config 

        var endpointBuilt = "https://api.bigpanda.io/resources/v2.0/environments/" + bpEnvId + "/incidents/" + bpID + "/snooze";
        var request = new sn_ws.RESTMessageV2();
        request.setHttpTimeout(10000);
        request.setRequestHeader("Authorization", "Bearer " + gs.getProperty('x_bip_panda.apiKey'));
        request.setRequestHeader("Content-Type", "application/json");
        request.setEndpoint(endpointBuilt);
		var requestBody = {};  // Null body

        if (incidentStateCurrent === 'On Hold') {
            bpActionType = 'Snooze';
            commentAnnotation = commentSnooze;

            // Snooze = PUT in Incident API V2
            request.setHttpMethod("PUT");
            // Prepare the request body for PUT 
            requestBody = {
                comment: commentAnnotation,
                end_time: endTime,
                cancel_on_incident_updates: cancelOnIncidentUpdates
            };


            request.setRequestBody(JSON.stringify(requestBody));



        } else if (['In Progress', 'Resolved', 'New', 'Closed', 'Canceled'].includes(incidentStateCurrent)) {
            bpActionType = 'Unsnooze';
            // Unsnooze = Delete in Incident V2 API
			request.setHttpMethod("DELETE");
            request.setRequestBody(JSON.stringify(requestBody)); // Pass Null body 
        } else {
            throw new Error('Script Action cannot proceed - ' + bpActionType + ' - Unexpected Incident State  - ' + incidentStateCurrent);
        }

        // Log the request details
        gs.info(bpActionType + ' - BigPanda incident ID: ' + bpID + ' [' + incidentTicketNumber + ']');
        gs.debug('Request Endpoint: ' + endpointBuilt);
        gs.debug('Request Body: ' + JSON.stringify(requestBody));

        // Execute the request
        var response = request.execute();
        var responseBody = response.getBody();
        var httpStatus = response.getStatusCode();


        // Check for good HTTP status code responses
        // You should expect status codes of 200, 201, 202, 204 in response from the BigPanda API endpoints when things are working correctly.  Anything else is unexpected.
        // Check docs.bigpanda.io API Reference to know which ones for the endpoint you're using in this script. 

        if (httpStatus === 200 || httpStatus === 201 || httpStatus === 202 || httpStatus === 204) {
            gs.info(bpActionType + ' - BigPanda API Interaction SUCCESS for BigPanda incident ID: ' + bpID + ' [' + incidentTicketNumber + '] - API HTTP Response Code: ' + httpStatus);
            gs.debug('Response Body: ' + responseBody);
        } else {
            throw new Error(bpActionType + ' - BigPanda API Interaction FAIL for BigPanda incident ID: ' + bpID + ' [' + incidentTicketNumber + '] - Unexpected API HTTP Response Code: ' + httpStatus + ' - Response: ' + responseBody);
        }
    } catch (ex) {
        gs.error('Error in Script Action for BigPanda ' + bpActionType + ' - ' + ex.message);
        gs.error('Stack Trace: ' + ex.stack);
    }

})(current, event);