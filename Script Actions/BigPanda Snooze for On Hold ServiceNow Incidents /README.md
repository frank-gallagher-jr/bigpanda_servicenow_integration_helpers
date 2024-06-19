
# BigPanda Integration - ServiceNow On-Hold = BigPanda Snoozed (Script Action)

**F. Gallagher (BigPanda) | June 2024 | Many thanks to P. Khoo (United Airlines) for assistance with development and testing.**

---

## Purpose

Snooze BigPanda incidents that are placed "on hold" in ServiceNow.

---

## Usage Note

- **Logs To:** System Logs > Application Logs ([https://your_instance.service-now.com/now/nav/ui/classic/params/target/syslog_app_scope_list.do](syslog_app_scope_list.do))  
  *Hint: Filter by "BigPanda" App Scope or "x_bip_panda" Source*
- **BigPanda Integration Version Support:**  
  BigPanda ServiceNow Integration Version 2.8 or newer recommended, but it will likely work on older and newer versions (may require tweaks).
- **ServiceNow Version Support:**  
  Should work in all recent ServiceNow versions, may require minor tweaks to align with customer-made customizations in the ServiceNow instance.
- **Tested:**  
  Confirmed to work in (unmodified) Vancouver Patch 8 with OOTB (unmodified) BigPanda V2.9 Integration.

---

## Implementation

**Generalized ServiceNow Requirements and Implementation Steps Checklist**

For any scripts like this to work, the BigPanda Integration MUST BE INSTALLED and CONFIGURED. Use the checklist below before complaining it doesn't work, please.

### Checklist

- **All steps must be executed while in the BigPanda application scope, logged in with ServiceNow administrator privileges.**
  
- **BigPanda Configuration Page:**
  - Browse to the BigPanda > Configuration Page ([https://your_instance.service-now.com/now/nav/ui/classic/params/target/x_bip_panda_Configuration.do](x_bip_panda_Configuration.do)) inside of ServiceNow.
  - Before continuing, confirm:
    - **Org Bearer Token:** Retrieved from BigPanda UI ServiceNow Integration Page.
    - **Incident App Key:** Retrieved from BigPanda UI ServiceNow Integration Page.
    - **(Integration) User API Key:** Starts with BPU... (set this up in the BigPanda UI if not already done).
  - If changes are made, confirm you’re in the BigPanda application scope and click **Submit** to save them.

- **ServiceNow User Administration ([https://your_instance.service-now.com/now/nav/ui/classic/params/target/sys_user.do](sys_user.do)):**
  - **BigPanda User and Role Assignment:**
    - Confirm the creation of a "BigPanda" user inside ServiceNow for the integration.
      - Set a password for this user.
      - Disable "Password Needs Reset".
      - Ensure the user is **Active**.
      - Check "Web service access only" unless there is a specific reason not to.
    - Assign the **x_bip_panda_user** role to the user in SN Roles Tab in User Administration.
    - Ensure the user and password for the ServiceNow BigPanda user exist in the integration configuration within BigPanda UI.

- **Incident Integration Confirmation:**
  - Ensure the ability to share incidents from BigPanda to ServiceNow and synchronization of work notes and state changes is working **bidirectionally**.

### SNOOZE = ON HOLD

- **ServiceNow (Logged in as Administrator | Application Scope: BigPanda):**

  - **Define an Event to Listen For:**
    - Within **System > Event Registry**, create an event named something like `"x_bip_panda.BigPanda.snoozeIncident"`.
      - Settings: Select Incident table, 100 order is typically fine.
      - Description: Triggers On Hold state change to snooze BigPanda Incident.

  - **Define What Triggers This Event:**
    - Within **System Definition > Business Rules**, create a Business Rule named something like `"BigPanda On Hold Sync Snoozed"`.
      - **Active** and **Advanced** must be checked.
      - **When to Run tab:** 
        - After: 100 is fine.
        - Update checked (no need for others generally).
        - **Filter Condition:** BigPanda ID is not empty **AND** Incident State "Changes To" On Hold.
      - **Advanced tab:**
        - **Condition:** Consider other conditions as needed: `gs.getProperty('x_bip_panda.IncidentsActive') == 'true'`
        - **Script:** `function executeRule(current) {  gs.eventQueue("x_bip_panda.BigPanda.snoozeIncident", current); }(current);`

  - **Define the Required Action When the Event Occurs:**
    - Within **System Policy > Events > Script Action** ([https://your_instance.service-now.com/now/nav/ui/classic/params/target/sysevent_script_action_list.do](sysevent_script_action_list.do)), create a Script Action named something like `"ProcessBigPandaSnoozeOnHold"`.
      - Find and select the Event Registry Event name you created (e.g., `x_bip_panda.BigPanda.snoozeIncident`).
      - Apply script logic for BigPanda Incident **Snooze**.

  - **Define Variables Used by the Script Action in a Centralized Way via a System Property:**
    - Create a system property ([https://your_instance.service-now.com/now/nav/ui/classic/params/target/sys_properties.do](sys_properties.do)) for:
      - Incident Environment ID referenced in the Snooze Script Action: `x_bip_panda.AllEnvironmentsID` (alternative: `x_bip_panda.<specificEnvId>` - Ensure API user can snooze in the environment you're setting).
      - Snooze Scheduling: `x_bip_panda.snoozeTimeOverride` - Integer value of snoozeDays defaults to +7 days from the time of On Hold state change (maximum snooze time is 89.99 days; 90.00 days can fail, so aim lower).
      - Cancel on Incident Updates: `x_bip_panda.snoozeCancelOnUpdates` - Should the incident become unsnoozed if it is updated?
        - If true, any updates to the incident (like alert state changes) on the BigPanda side will cancel the snooze. Expiry date time, manual cancellation of the snooze in BP, and/or incident state changes away from On Hold will cancel the snooze.
        - If false, all updates to the incident will be ignored. The snooze will continue until expiry date and time, until manually unsnoozed in BigPanda, or until On Hold state changes (if unsnooze is scripted).

  - **Snooze:** HTTP PUT (Comments are included for clarity).

  - **Unsnooze / Cancel:** HTTP DELETE (No comments are possible via this method).

---

### Reference Incident States Display Names and State Codes

- **New:** 1
- **In Progress:** 2
- **On Hold:** 3
- **Resolved:** 6
- **Closed:** 7
- **Canceled:** 8
