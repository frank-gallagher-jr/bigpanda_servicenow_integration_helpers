# BigPanda CMDB Configuration ServiceNow Update Set 

The file contains an example configuration for the CMDB Table Export feature found inside of your BigPanda > Configuration page inside of ServiceNow.  You must have the application installed for this update set to work.

![image](https://github.com/frank-gallagher-jr/bigpanda_servicenow_integration_helpers/assets/99338731/50c9b994-8c69-4e94-8d64-eb9c280b29dc)




----> I imply no warranty nor intend to provide any support.  Apply at your own risk.  Consult with your BigPanda support team before using this file. 

----> Official documentation is on the BigPanda docs site - https://docs.bigpanda.io/docs/servicenow-cmdb 

----> Consider applying in a lower environment before using in your production environment!  You can apply this file like you would any other update set inside of ServiceNow.


_________________________________________________________________

Usage and Applicability Notes

Not all customers utilize all types of Configuration Item Classes (CIs) in their CMDB.  The provided update set should be used as a reference for configuration, but you should plan to make edits to suit your specific ServiceNow environment and the System Classes in use by your company.  

Confirm that the attributes defined for each CI class (BigPanda "Exported Columns") meets your needs and adjust these accordingly.  

Be sure to map values which might overlap to different tag names in the Column Mapping section.  For example:  If a server name CI uses the same table key ("name") as an application name table key ("name") make sure to map like this for each exported class table - cmdb_ci_server - name:host & cmdb_ci_appl - name:application - Doing this will prevent enrichment table overwritting. 


_____________

Query Filters follow table filtering rules which are similar in the ServiceNow UI.  You can filter a CI list in the ServiceNow UI and utilize that filter in the "Query Filter" area for each table export. 

![image](https://github.com/frank-gallagher-jr/bigpanda_servicenow_integration_helpers/assets/99338731/f78940af-c639-4fec-b1d6-9e606568cb62)

Some common filtering examples -  

--> "operational_status!=6" - This excludes any CIs which are marked as retired from being synchronized wth BigPanda.

--> "typeSTARTSWITHConnect^ORtypeSTARTSWITHHost" - This would include any CI relationship types which start with Connect (Connected by::Connects, Connects to::Connected by) OR Host (Hosted on::Hosts)


_________________________________________________________________

**ServiceNow CMDB Relationship Table Reference**

*This is a snapshot taken of common relationship definitions taken in 2023* - Consult the current ServiceNow documentation for your instance and reference your cmdb_rel_ci_list.do and CI Class Manager to review and make adjustments to align with your configuration.

![image](https://github.com/frank-gallagher-jr/bigpanda_servicenow_integration_helpers/assets/99338731/58f11b7d-23b6-4c5c-8725-a49f83ca1911)





*This was tested and confirmed working with a BigPanda integration version 2.9 on a Vancouver Patch 1 PDI* 

